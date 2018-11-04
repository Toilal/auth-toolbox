import {
  AuthListener,
  ClientAdapter,
  IAuth,
  Request,
  RequestInterceptor,
  Response,
  ResponseInterceptor,
  ServerAdapter,
  ServerConfiguration,
  TokenDecoder,
  Tokens,
  TokenStorage
} from './auth-toolbox'

import DefaultTokenDecoder from './token-decoder/default-token-decoder'
import DefaultTokenStorage from './token-storage/default-token-storage'

export default class Auth<C, R> implements IAuth<C, R>, RequestInterceptor, ResponseInterceptor {
  private serverAdapter: ServerAdapter<C>
  private serverConfiguration: ServerConfiguration
  private clientAdapter: ClientAdapter<R>
  private accessTokenDecoder?: TokenDecoder | null
  private tokenStorage?: TokenStorage | null
  private persistentTokenStorage?: TokenStorage | null
  private listeners: AuthListener[] = []

  private tokens?: Tokens
  private saveCredentials: boolean = false
  private interceptors: (() => void)[] = []

  private renewRunning: boolean = false
  private renewPromises: { promise: Promise<any>, resolve: any, reject: any }[] = []

  constructor (serverConfiguration: ServerConfiguration,
               serverAdapter: ServerAdapter<C>,
               clientAdapter: ClientAdapter<R>,
               accessTokenDecoder: TokenDecoder | null = new DefaultTokenDecoder(),
               tokenStorage: TokenStorage | null = new DefaultTokenStorage(sessionStorage),
               persistentTokenStorage: TokenStorage | null = new DefaultTokenStorage(localStorage)) {
    this.serverConfiguration = serverConfiguration
    this.serverAdapter = serverAdapter
    this.clientAdapter = clientAdapter
    this.accessTokenDecoder = accessTokenDecoder
    this.tokenStorage = tokenStorage
    this.persistentTokenStorage = persistentTokenStorage
    this.initClientAdapter()
  }

  public async loadTokensFromStorage (): Promise<Tokens | undefined> {
    if (this.tokenStorage) {
      let tokens = await this.tokenStorage.getTokens()
      if (this.persistentTokenStorage) {
        let persistentTokens = await this.persistentTokenStorage.getTokens()
        if (persistentTokens) {
          this.saveCredentials = true
        }

        if (!tokens) {
          tokens = persistentTokens
        }

        if (!tokens) {
          await this.persistentTokenStorage.clear()
        } else {
          await this.persistentTokenStorage.store(tokens)
        }
      }

      if (!tokens) {
        await this.unsetTokens()
      } else {
        await this.setTokens(tokens)
      }

      return tokens
    }
  }

  release () {
    for (const handle of this.interceptors) {
      handle()
    }

    this.removeListener(...this.listeners)
  }

  addListener (...listeners: AuthListener[]) {
    this.listeners.push(...listeners)
  }

  removeListener (...listeners: AuthListener[]) {
    for (const listener of listeners) {
      const indexOf = this.listeners.indexOf(listener)

      if (indexOf > -1) {
        this.listeners.splice(indexOf, 1)
      }
    }
  }

  getTokens (): Tokens | undefined {
    return this.tokens
  }

  get accessToken (): string | undefined {
    return this.tokens && this.tokens.access ? this.tokens.access.value : undefined
  }

  get refreshToken (): string | undefined {
    return this.tokens && this.tokens.refresh ? this.tokens.refresh.value : undefined
  }

  isSaveCredentials (): boolean {
    return this.saveCredentials
  }

  isAuthenticated (): boolean {
    return !!this.tokens
  }

  async login (credentials: C, saveCredentials?: boolean): Promise<R> {
    const serverConfiguration = this.serverConfiguration
    const request = this.serverAdapter.asLoginRequest(serverConfiguration.loginEndpoint, credentials)
    const response = await this.clientAdapter.login(request)
    const tokens = this.serverAdapter.getResponseTokens(response)
    if (saveCredentials !== undefined) {
      this.saveCredentials = !!saveCredentials
    }
    await this.setTokens(tokens)
    this.listeners.forEach(l => l.login && l.login())
    return response
  }

  async renew (): Promise<R | void> {
    if (this.tokens && this.serverConfiguration.renewEndpoint) {
      if (!this.renewRunning) {
        try {
          this.renewRunning = true
          const request = this.serverAdapter.asRenewRequest(this.serverConfiguration.renewEndpoint, this.tokens)
          const response = await this.clientAdapter.renew(request)
          const tokens = this.serverAdapter.getResponseTokens(response)
          await this.setTokens(tokens)
          for (const renewTokenPromise of this.renewPromises) {
            renewTokenPromise.resolve(response)
          }
          this.listeners.forEach(l => l.renew && l.renew())
          return response
        } catch (err) {
          for (const renewTokenPromise of this.renewPromises) {
            renewTokenPromise.reject(err)
          }
          throw err
        } finally {
          this.renewRunning = false
          this.renewPromises = []
        }
      } else {
        const renewTokenPromise = new Promise<R>((resolve, reject) => {
          this.renewPromises.push({ promise: renewTokenPromise, resolve, reject })
        })
        return renewTokenPromise
      }
    }
  }

  async logout (): Promise<R | void> {
    if (this.tokens) {
      let response
      const serverConfiguration = this.serverConfiguration
      if (serverConfiguration.logoutEndpoint) {
        const request = this.serverAdapter.asLogoutRequest(serverConfiguration.logoutEndpoint, this.tokens)
        response = await this.clientAdapter.logout(request)
      }
      await this.unsetTokens()
      this.listeners.forEach(l => l.logout && l.logout())
      if (response) {
        return response
      }
    }
  }

  private initClientAdapter () {
    this.interceptors.push(this.clientAdapter.setupRequestInterceptor(this))
    this.interceptors.push(this.clientAdapter.setupErrorResponseInterceptor(this))
  }

  private isLoginRequest (request: Request) {
    const serverConfiguration = this.serverConfiguration
    if (serverConfiguration.loginEndpoint &&
      serverConfiguration.loginEndpoint.method.toLowerCase() === request.method.toLowerCase() &&
      serverConfiguration.loginEndpoint.url === request.url) {
      return true
    }
    return false
  }

  private isRenewRequest (request: Request) {
    const serverConfiguration = this.serverConfiguration
    if (serverConfiguration.renewEndpoint &&
      serverConfiguration.renewEndpoint.method.toLowerCase() === request.method.toLowerCase() &&
      serverConfiguration.renewEndpoint.url === request.url) {
      return true
    }
    return false
  }

  private async expired () {
    await this.unsetTokens()
    this.listeners.forEach(l => l.expired && l.expired())
  }

  private async unsetTokens () {
    this.tokens = undefined
    if (this.persistentTokenStorage) {
      await this.persistentTokenStorage.clear()
    }
    if (this.tokenStorage) {
      await this.tokenStorage.clear()
    }
    this.listeners.forEach(l => l.tokensChanged && l.tokensChanged())
  }

  private async setTokens (tokens: Tokens) {
    if (this.tokenStorage) {
      await this.tokenStorage.store(tokens)
    }
    if (this.persistentTokenStorage) {
      if (this.saveCredentials) {
        await this.persistentTokenStorage.store(tokens)
      } else {
        await this.persistentTokenStorage.clear()
      }
    }
    this.tokens = tokens
    this.listeners.forEach(l => l.tokensChanged && l.tokensChanged(this.tokens))
  }

  async interceptRequest (request: Request) {
    let tokens = this.getTokens()
    const isLoginRequest = this.isLoginRequest(request)
    if (tokens && tokens.access && !isLoginRequest) {
      const isRenewRequest = this.isRenewRequest(request)
      if (tokens.refresh && !isRenewRequest && this.accessTokenDecoder && this.accessTokenDecoder.isExpired(tokens.access)) {
        try {
          await this.renew()
        } catch (err) {
          await this.expired()
          throw err
        }
        tokens = this.getTokens()! // it's been renewed, so we are sure tokens are defined
      }
      this.serverAdapter.setAccessToken(request, tokens.access.value)
      return true
    }
    return false
  }

  async interceptResponse (request: Request, response: Response) {
    const tokens = this.getTokens()
    const refreshToken = tokens && tokens.refresh ? tokens.refresh.value : undefined

    if (!refreshToken) {
      return false
    }

    const isRenewRequest = this.isRenewRequest(request)
    if (!isRenewRequest && this.serverAdapter.accessTokenHasExpired(request, response)) {
      try {
        await this.renew()
        return true
      } catch (err) {
        await this.expired()
        return false
      }
    } else if (isRenewRequest && this.serverAdapter.refreshTokenHasExpired(request, response)) {
      await this.expired()
      return false
    }

    return false
  }
}
