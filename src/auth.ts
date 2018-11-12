import {
  AuthListener,
  AuthOptions,
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
  TokenStorage,
  TokenStorageAsync,
  UsernamePasswordCredentials
} from './auth-toolbox'

import { DefaultTokenDecoder } from './token-decoder/default-token-decoder'
import { DefaultTokenStorage } from './token-storage/default-token-storage'
import { toTokenStorageAsync, toTokenStorageSync } from './token-storage/async-adapter'

const defaultAuthOptions: AuthOptions = {
  accessTokenDecoder: new DefaultTokenDecoder(),
  tokenStorage: new DefaultTokenStorage(sessionStorage),
  persistentTokenStorage: new DefaultTokenStorage(localStorage),
  clientInterceptors: true
}

/**
 * Default entrypoint for auth-toolbox module.
 *
 * Load tokens from {@link TokenStorage}, support authentication methods like {@link login} and
 * {@link logout}, and automates the authentication of client provided with {@link ClientAdapter}.
 *
 * Options can be defined with {@link AuthOptions}.
 *
 * @param C Credentials type
 * @param R Client response type
 */
export class Auth<C = UsernamePasswordCredentials, R = any>
  implements IAuth<C, R>, RequestInterceptor, ResponseInterceptor {
  /**
   * @inheritDoc
   */
  usePersistentStorage: boolean = false

  private serverAdapter: ServerAdapter<C>
  private serverConfiguration: ServerConfiguration | Promise<ServerConfiguration>
  private deferredServerConfiguration!: ServerConfiguration
  private clientAdapter: ClientAdapter<R>
  private accessTokenDecoder?: TokenDecoder | null
  private tokenStorage?: TokenStorage | null
  private persistentTokenStorage?: TokenStorage | null
  private tokenStorageAsync?: TokenStorageAsync | null
  private persistentTokenStorageAsync?: TokenStorageAsync | null
  private listeners: AuthListener[] = []

  private tokens?: Tokens<C>
  private interceptors: (() => void)[] = []

  private renewRunning: boolean = false
  private renewPromises: { promise: Promise<any>; resolve: any; reject: any }[] = []

  /**
   * Builds an instance with given configuration.
   *
   * @param serverConfiguration Server configuration to use.
   *                            It may be a hardcoded configuration, or a configuration build from
   *                            a discovery service.
   * @param serverAdapter       Server adapter to use.
   * @param clientAdapter       Client adapter to user.
   * @param options             Options
   */
  constructor(
    serverConfiguration: ServerConfiguration | Promise<ServerConfiguration>,
    serverAdapter: ServerAdapter<C>,
    clientAdapter: ClientAdapter<R>,
    options?: AuthOptions | null
  ) {
    this.serverConfiguration = serverConfiguration
    this.serverAdapter = serverAdapter
    this.clientAdapter = clientAdapter

    const effectiveOptions = Object.assign({}, defaultAuthOptions, options)
    this.accessTokenDecoder = effectiveOptions.accessTokenDecoder

    this.tokenStorage = toTokenStorageSync(effectiveOptions.tokenStorage)
    this.tokenStorageAsync = toTokenStorageAsync(effectiveOptions.tokenStorage)

    this.persistentTokenStorage = toTokenStorageSync(effectiveOptions.persistentTokenStorage)
    this.persistentTokenStorageAsync = toTokenStorageAsync(effectiveOptions.persistentTokenStorage)

    if (effectiveOptions.listeners) {
      this.addListener(...effectiveOptions.listeners)
    }

    if (effectiveOptions.clientInterceptors) {
      this.initClientAdapter()
    }

    if (
      effectiveOptions.loadTokensFromStorage === undefined ||
      effectiveOptions.loadTokensFromStorage === null
    ) {
      // If undefined or null, tokens will be loaded only if storage supports sync loading.
      effectiveOptions.loadTokensFromStorage = this.storageSync
    }

    if (effectiveOptions.loadTokensFromStorage) {
      if (this.storageSync) {
        this.loadTokensFromStorage()
        this.listeners.forEach(l => l.initialized && l.initialized(true))
      } else {
        this.loadTokensFromStorageAsync()
          .then(() => {
            this.listeners.forEach(l => l.initialized && l.initialized(true))
          })
          .catch(e => {
            console.error('An error has occured while loading tokens from async storage.')
            console.error(e)
          })
      }
    } else {
      this.listeners.forEach(l => l.initialized && l.initialized(false))
    }
  }

  /**
   * @inheritDoc
   */
  get storageSync(): boolean {
    if (this.tokenStorageAsync && !this.tokenStorage) {
      return false
    }

    if (this.persistentTokenStorageAsync && !this.persistentTokenStorage) {
      return false
    }

    return true
  }

  /**
   * @inheritDoc
   */
  public async loadTokensFromStorageAsync(): Promise<Tokens<C> | undefined> {
    if (this.tokenStorageAsync) {
      let tokens = await this.tokenStorageAsync.getTokens<C>()
      if (this.persistentTokenStorageAsync) {
        let persistentTokens = await this.persistentTokenStorageAsync.getTokens<C>()
        if (persistentTokens) {
          this.usePersistentStorage = true
        }

        if (!tokens) {
          tokens = persistentTokens
        }

        if (!tokens) {
          await this.persistentTokenStorageAsync.clear()
        } else {
          await this.persistentTokenStorageAsync.store(tokens)
        }
      }

      if (!tokens) {
        await this.unsetTokensImplAsync()
      } else {
        await this.setTokensImplAsync(tokens)
      }
      return tokens
    }
  }

  /**
   * @inheritDoc
   */
  public loadTokensFromStorage(): Tokens<C> | undefined {
    if (this.tokenStorageAsync) {
      if (!this.tokenStorage) {
        throw new Error('tokenStorage is async. Use loadTokensFromStorageAsync method instead')
      }
      let tokens = this.tokenStorage.getTokens<C>()
      if (this.persistentTokenStorageAsync) {
        if (!this.persistentTokenStorage) {
          throw new Error(
            'persistentTokenStorage is async. Use loadTokensFromStorageAsync method instead'
          )
        }
        let persistentTokens = this.persistentTokenStorage.getTokens<C>()
        if (persistentTokens) {
          this.usePersistentStorage = true
        }

        if (!tokens) {
          tokens = persistentTokens
        }

        if (!tokens) {
          this.persistentTokenStorage.clear()
        } else {
          this.persistentTokenStorage.store(tokens)
        }
      }

      if (!tokens) {
        this.unsetTokensImpl()
      } else {
        this.setTokensImpl(tokens)
      }

      return tokens
    }
  }

  /**
   * @inheritDoc
   */
  release() {
    for (const handle of this.interceptors) {
      handle()
    }

    this.removeListener(...this.listeners)
  }

  /**
   * @inheritDoc
   */
  addListener(...listeners: AuthListener[]) {
    this.listeners.push(...listeners)
  }

  /**
   * @inheritDoc
   */
  removeListener(...listeners: AuthListener[]) {
    for (const listener of listeners) {
      const indexOf = this.listeners.indexOf(listener)

      if (indexOf > -1) {
        this.listeners.splice(indexOf, 1)
      }
    }
  }

  /**
   * @inheritDoc
   */
  getTokens(): Tokens<C> | undefined {
    return this.tokens
  }

  /**
   * @inheritDoc
   */
  decodeAccessToken(): any | undefined {
    if (this.tokens) {
      if (!this.accessTokenDecoder || !this.accessTokenDecoder.decode) {
        throw new Error(
          'An accessTokenDecoder supporting decode method should be defined to decode access token.'
        )
      }
      return this.accessTokenDecoder.decode(this.tokens.access)
    }
  }

  /**
   * @inheritDoc
   */
  isAuthenticated(): boolean {
    return !!this.tokens
  }

  async getServerConfiguration(): Promise<ServerConfiguration> {
    if (!this.deferredServerConfiguration) {
      this.deferredServerConfiguration = await this.serverConfiguration
    }
    return this.deferredServerConfiguration
  }

  /**
   * @inheritDoc
   */
  async login(credentials: C): Promise<R> {
    const response = await this.loginImpl(credentials)
    this.listeners.forEach(l => l.login && l.login())
    return response
  }

  private async loginImpl(credentials: C): Promise<R> {
    const serverConfiguration = await this.getServerConfiguration()
    const request = this.serverAdapter.asLoginRequest(
      serverConfiguration.loginEndpoint,
      credentials
    )
    const response = await this.clientAdapter.login(request)
    const tokens = this.serverAdapter.getResponseTokens(response)
    if (this.usePersistentStorage && !serverConfiguration.renewEndpoint) {
      tokens.credentials = credentials
    }
    await this.setTokensImplAsync(tokens)
    return response
  }

  /**
   * @inheritDoc
   */
  async renew(): Promise<R | void> {
    const serverConfiguration = await this.getServerConfiguration()
    if (this.tokens && serverConfiguration) {
      if (!this.renewRunning) {
        try {
          this.renewRunning = true
          let response: R
          if (serverConfiguration.renewEndpoint) {
            if (!this.tokens.refresh) {
              throw new Error('No refresh token available to renew')
            }
            const request = this.serverAdapter.asRenewRequest(
              serverConfiguration.renewEndpoint,
              this.tokens.refresh
            )
            response = await this.clientAdapter.renew(request)
          } else {
            if (!this.tokens.credentials) {
              throw new Error(
                'Credentials are not available. ' +
                  'usePersistentStorage should be true to allow renew method without renewEndpoint and refresh token.'
              )
            }
            response = await this.loginImpl(this.tokens.credentials)
          }

          const tokens = this.serverAdapter.getResponseTokens(response)
          await this.setTokensImplAsync(tokens)
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

  /**
   * @inheritDoc
   */
  async logout(): Promise<R | void> {
    if (this.tokens) {
      let response
      const serverConfiguration = await this.getServerConfiguration()
      if (serverConfiguration.logoutEndpoint && this.tokens.refresh) {
        const request = this.serverAdapter.asLogoutRequest(
          serverConfiguration.logoutEndpoint,
          this.tokens.refresh
        )
        response = await this.clientAdapter.logout(request)
      }
      await this.unsetTokensImplAsync()
      this.listeners.forEach(l => l.logout && l.logout())
      return response
    }
  }

  private initClientAdapter() {
    this.interceptors.push(this.clientAdapter.setupRequestInterceptor(this))
    this.interceptors.push(this.clientAdapter.setupErrorResponseInterceptor(this))
  }

  private async isLoginRequest(request: Request) {
    const serverConfiguration = await this.getServerConfiguration()
    if (
      serverConfiguration.loginEndpoint &&
      serverConfiguration.loginEndpoint.method.toLowerCase() === request.method.toLowerCase() &&
      serverConfiguration.loginEndpoint.url === request.url
    ) {
      return true
    }
    return false
  }

  private async isRenewRequest(request: Request) {
    const serverConfiguration = await this.getServerConfiguration()
    if (
      serverConfiguration.renewEndpoint &&
      serverConfiguration.renewEndpoint.method.toLowerCase() === request.method.toLowerCase() &&
      serverConfiguration.renewEndpoint.url === request.url
    ) {
      return true
    }
    return false
  }

  private async expired() {
    if (this.tokens) {
      await this.unsetTokensImplAsync()
      this.listeners.forEach(l => l.expired && l.expired())
    }
  }

  private async unsetTokensImplAsync() {
    this.tokens = undefined
    if (this.persistentTokenStorageAsync) {
      await this.persistentTokenStorageAsync.clear()
    }
    if (this.tokenStorageAsync) {
      await this.tokenStorageAsync.clear()
    }
    this.listeners.forEach(l => l.tokensChanged && l.tokensChanged())
  }

  private async setTokensImplAsync(tokens: Tokens<C>) {
    if (this.tokenStorageAsync) {
      await this.tokenStorageAsync.store(tokens)
    }
    if (this.persistentTokenStorageAsync) {
      if (this.usePersistentStorage) {
        await this.persistentTokenStorageAsync.store(tokens)
      } else {
        await this.persistentTokenStorageAsync.clear()
      }
    }
    this.tokens = tokens
    this.listeners.forEach(l => l.tokensChanged && l.tokensChanged(this.tokens))
  }

  private unsetTokensImpl() {
    if (this.tokenStorageAsync) {
      if (!this.tokenStorage) {
        throw new Error('tokenStorage is async. Use setTokensAsync method instead')
      }
      this.tokenStorage.clear()
    }
    if (this.persistentTokenStorageAsync) {
      if (!this.persistentTokenStorage) {
        throw new Error('persistentTokenStorage is async. Use setTokensAsync method instead')
      }
      this.persistentTokenStorage.clear()
    }
    this.tokens = undefined
    this.listeners.forEach(l => l.tokensChanged && l.tokensChanged())
  }

  private setTokensImpl(tokens: Tokens<C>) {
    if (this.tokenStorageAsync) {
      if (!this.tokenStorage) {
        throw new Error('tokenStorage is async. Use setTokensAsync method instead')
      }
      this.tokenStorage.store(tokens)
    }
    if (this.persistentTokenStorageAsync) {
      if (!this.persistentTokenStorage) {
        throw new Error('persistentTokenStorage is async. Use setTokensAsync method instead')
      }

      if (this.usePersistentStorage) {
        this.persistentTokenStorage.store(tokens)
      } else {
        this.persistentTokenStorage.clear()
      }
    }
    this.tokens = tokens
    this.listeners.forEach(l => l.tokensChanged && l.tokensChanged(this.tokens))
  }

  /**
   * @inheritDoc
   */
  public setTokens(tokens: Tokens<C> | undefined | null) {
    if (tokens) {
      this.setTokensImpl(tokens)
    } else {
      this.unsetTokensImpl()
    }
  }

  /**
   * @inheritDoc
   */
  public async setTokensAsync(tokens: Tokens<C> | undefined | null) {
    if (tokens) {
      await this.setTokensImplAsync(tokens)
    } else {
      await this.unsetTokensImplAsync()
    }
  }

  /**
   * @inheritDoc
   */
  async interceptRequest(request: Request) {
    let tokens = this.getTokens()
    const isLoginRequest = await this.isLoginRequest(request)
    if (tokens && tokens.access && !isLoginRequest) {
      const isRenewRequest = await this.isRenewRequest(request)
      if (
        tokens.refresh &&
        !isRenewRequest &&
        this.accessTokenDecoder &&
        this.accessTokenDecoder.isExpired &&
        this.accessTokenDecoder.isExpired(tokens.access)
      ) {
        try {
          await this.renew()
        } catch (err) {
          await this.expired()
          throw err
        }
        tokens = this.getTokens()
      }
      this.serverAdapter.setAccessToken(request, tokens!.access.value)
      return true
    }
    return false
  }

  /**
   * @inheritDoc
   */
  async interceptResponse(request: Request, response: Response) {
    const tokens = this.getTokens()
    const refreshToken = tokens && tokens.refresh ? tokens.refresh.value : undefined

    if (!refreshToken) {
      return false
    }

    const isRenewRequest = await this.isRenewRequest(request)
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
