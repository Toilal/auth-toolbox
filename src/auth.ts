import {
  AuthListener,
  AuthOptions,
  ClientAdapter,
  Exclude,
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
export class Auth<C = UsernamePasswordCredentials, R = any> implements IAuth<C, R>, RequestInterceptor, ResponseInterceptor {
  /**
   * @inheritDoc
   */
  usePersistentStorage: boolean = false

  private readonly serverAdapter: ServerAdapter<C>
  private readonly serverConfiguration: ServerConfiguration | Promise<ServerConfiguration>
  private deferredServerConfiguration!: ServerConfiguration
  private readonly clientAdapter: ClientAdapter<R>
  private readonly accessTokenDecoder?: TokenDecoder | null
  private readonly tokenStorage?: TokenStorage | null
  private readonly persistentTokenStorage?: TokenStorage | null
  private readonly tokenStorageAsync?: TokenStorageAsync | null
  private readonly persistentTokenStorageAsync?: TokenStorageAsync | null
  private readonly listeners: AuthListener[] = []
  private readonly excludes: Array<(request: Request, response?: Response) => boolean> = []

  private tokens?: Tokens<C>
  private readonly interceptors: Array<() => void> = []

  private renewRunning: boolean = false
  private renewPromises: Array<{ promise: Promise<any>, resolve: any, reject: any }> = []

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
  constructor (
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

    if (effectiveOptions.listeners != null) {
      this.addListener(...effectiveOptions.listeners)
    }

    if (effectiveOptions.clientInterceptors) {
      this.initClientAdapter()
    }

    if (effectiveOptions.excludes != null) {
      this.addExclude(...effectiveOptions.excludes)
    }

    if (effectiveOptions.loadTokensFromStorage === undefined || effectiveOptions.loadTokensFromStorage === null) {
      // If undefined or null, tokens will be loaded only if storage supports sync loading.
      effectiveOptions.loadTokensFromStorage = this.storageSync
    }

    if (effectiveOptions.loadTokensFromStorage) {
      if (this.storageSync) {
        this.loadTokensFromStorage()
        this.listeners.forEach(l => l.initialized?.(true))
      } else {
        this.loadTokensFromStorageAsync()
          .then(() => {
            this.listeners.forEach(l => l.initialized?.(true))
          })
          .catch(e => {
            this.listeners.forEach(l => l.initialized?.(false, e))
          })
      }
    } else {
      this.listeners.forEach(l => l.initialized?.(false))
    }
  }

  /**
   * @inheritDoc
   */
  get storageSync (): boolean {
    if ((this.tokenStorageAsync != null) && (this.tokenStorage == null)) {
      return false
    }

    if ((this.persistentTokenStorageAsync != null) && (this.persistentTokenStorage == null)) {
      return false
    }

    return true
  }

  /**
   * @inheritDoc
   */
  public async loadTokensFromStorageAsync (): Promise<Tokens<C> | undefined> {
    if (this.tokenStorageAsync != null) {
      let tokens = await this.tokenStorageAsync.getTokens<C>()
      if (this.persistentTokenStorageAsync != null) {
        const persistentTokens = await this.persistentTokenStorageAsync.getTokens<C>()
        if (persistentTokens != null) {
          this.usePersistentStorage = true
        }

        if (tokens == null) {
          tokens = persistentTokens
        }

        if (tokens == null) {
          await this.persistentTokenStorageAsync.clear()
        } else {
          await this.persistentTokenStorageAsync.store(tokens)
        }
      }

      if (tokens == null) {
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
  public loadTokensFromStorage (): Tokens<C> | undefined {
    if (this.tokenStorageAsync != null) {
      if (this.tokenStorage == null) {
        throw new Error('tokenStorage is async. Use loadTokensFromStorageAsync method instead')
      }
      let tokens = this.tokenStorage.getTokens<C>()
      if (this.persistentTokenStorageAsync != null) {
        if (this.persistentTokenStorage == null) {
          throw new Error('persistentTokenStorage is async. Use loadTokensFromStorageAsync method instead')
        }
        const persistentTokens = this.persistentTokenStorage.getTokens<C>()
        if (persistentTokens != null) {
          this.usePersistentStorage = true
        }

        if (tokens == null) {
          tokens = persistentTokens
        }

        if (tokens == null) {
          this.persistentTokenStorage.clear()
        } else {
          this.persistentTokenStorage.store(tokens)
        }
      }

      if (tokens == null) {
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
  release (): void {
    for (const handle of this.interceptors) {
      handle()
    }

    this.removeListener(...this.listeners)
  }

  /**
   * @inheritDoc
   */
  addListener (...listeners: AuthListener[]): void {
    this.listeners.push(...listeners)
  }

  /**
   * @inheritDoc
   */
  removeListener (...listeners: AuthListener[]): void {
    for (const listener of listeners) {
      const indexOf = this.listeners.indexOf(listener)

      if (indexOf > -1) {
        this.listeners.splice(indexOf, 1)
      }
    }
  }

  public addExclude (...excludes: Exclude[]): void {
    for (const exclude of excludes) {
      let excludeFunction: (request: Request, response?: Response) => boolean

      if (typeof exclude === 'string') {
        excludeFunction = (request: Request) => request.url === exclude
      } else if (exclude instanceof RegExp) {
        excludeFunction = (request: Request) => exclude.test(request.url)
      } else {
        excludeFunction = exclude
      }

      this.excludes.push(excludeFunction)
    }
  }

  /**
   * @inheritDoc
   */
  getTokens (): Tokens<C> | undefined {
    return this.tokens
  }

  /**
   * @inheritDoc
   */
  decodeAccessToken (): any | undefined {
    if (this.tokens != null) {
      if ((this.accessTokenDecoder == null) || (this.accessTokenDecoder.decode == null)) {
        throw new Error('An accessTokenDecoder supporting decode method should be defined to decode access token.')
      }
      return this.accessTokenDecoder.decode(this.tokens.access)
    }
  }

  isExpiredAccessToken (offset?: number): boolean | undefined {
    if (this.tokens != null) {
      if ((this.accessTokenDecoder == null) || (this.accessTokenDecoder.isExpired == null)) {
        throw new Error(
          'An accessTokenDecoder supporting isExpired method should be defined to check if access token is expired.'
        )
      }
      return this.accessTokenDecoder.isExpired(this.tokens.access, offset)
    }
  }

  /**
   * @inheritDoc
   */
  isAuthenticated (): boolean {
    return !(this.tokens == null)
  }

  async getServerConfiguration (): Promise<ServerConfiguration> {
    if (!this.deferredServerConfiguration) {
      this.deferredServerConfiguration = await this.serverConfiguration
    }
    return this.deferredServerConfiguration
  }

  /**
   * @inheritDoc
   */
  async login (credentials: C): Promise<R> {
    const response = await this.loginImpl(credentials)
    this.listeners.forEach(l => l.login?.())
    return response
  }

  private async loginImpl (credentials: C): Promise<R> {
    const serverConfiguration = await this.getServerConfiguration()
    const request = this.serverAdapter.asLoginRequest(serverConfiguration, credentials)
    const response = await this.clientAdapter.login(request)
    const tokens = this.serverAdapter.getResponseTokens(response)
    if (this.usePersistentStorage && this.serverAdapter.shouldPersistCredentials(serverConfiguration)) {
      tokens.credentials = credentials
    }
    await this.setTokensImplAsync(tokens)
    return response
  }

  /**
   * @inheritDoc
   */
  async renew (): Promise<R | undefined> {
    const serverConfiguration = await this.getServerConfiguration()
    if ((this.tokens != null) && serverConfiguration) {
      if (!this.renewRunning) {
        try {
          this.renewRunning = true
          let response: R | undefined
          const request = this.serverAdapter.asRenewRequest(serverConfiguration, this.tokens)
          if (request != null) {
            response = await this.clientAdapter.renew(request)
          }

          if ((response == null) && (this.tokens.credentials != null)) {
            response = await this.loginImpl(this.tokens.credentials)
          }

          if (response == null) {
            throw new Error('Can\'t renew with the current state.')
          }

          const tokens = this.serverAdapter.getResponseTokens(response)
          tokens.credentials = this.tokens.credentials
          await this.setTokensImplAsync(tokens)
          for (const renewTokenPromise of this.renewPromises) {
            renewTokenPromise.resolve(response)
          }

          this.listeners.forEach(l => l.renew?.())

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
  async logout (): Promise<R | undefined> {
    let response: R | undefined

    const tokens = this.tokens
    await this.unsetTokensImplAsync()

    const serverConfiguration = await this.getServerConfiguration()
    const request = this.serverAdapter.asLogoutRequest(serverConfiguration, tokens)
    if (request != null) {
      response = await this.clientAdapter.logout(request)
    }

    this.listeners.forEach(l => l.logout?.())

    return response
  }

  private initClientAdapter (): void {
    this.interceptors.push(this.clientAdapter.setupRequestInterceptor(this))
    this.interceptors.push(this.clientAdapter.setupErrorResponseInterceptor(this))
  }

  private async isLoginRequest (request: Request): Promise<boolean> {
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

  private async isRenewRequest (request: Request): Promise<boolean> {
    const serverConfiguration = await this.getServerConfiguration()
    if (
      (serverConfiguration.renewEndpoint != null) &&
      serverConfiguration.renewEndpoint.method.toLowerCase() === request.method.toLowerCase() &&
      serverConfiguration.renewEndpoint.url === request.url
    ) {
      return true
    }
    return false
  }

  private async expired (): Promise<void> {
    if (this.tokens != null) {
      await this.unsetTokensImplAsync()
      this.listeners.forEach(l => l.expired?.())
    }
  }

  private async unsetTokensImplAsync (): Promise<void> {
    this.tokens = undefined
    if (this.persistentTokenStorageAsync != null) {
      await this.persistentTokenStorageAsync.clear()
    }
    if (this.tokenStorageAsync != null) {
      await this.tokenStorageAsync.clear()
    }
    this.listeners.forEach(l => l.tokensChanged?.())
  }

  private async setTokensImplAsync (tokens: Tokens<C>): Promise<void> {
    if (this.tokenStorageAsync != null) {
      await this.tokenStorageAsync.store(tokens)
    }
    if (this.persistentTokenStorageAsync != null) {
      if (this.usePersistentStorage) {
        await this.persistentTokenStorageAsync.store(tokens)
      } else {
        await this.persistentTokenStorageAsync.clear()
      }
    }
    this.tokens = tokens
    this.listeners.forEach(l => l.tokensChanged?.(this.tokens))
  }

  private unsetTokensImpl (): void {
    if (this.tokenStorageAsync != null) {
      if (this.tokenStorage == null) {
        throw new Error('tokenStorage is async. Use setTokensAsync method instead')
      }
      this.tokenStorage.clear()
    }
    if (this.persistentTokenStorageAsync != null) {
      if (this.persistentTokenStorage == null) {
        throw new Error('persistentTokenStorage is async. Use setTokensAsync method instead')
      }
      this.persistentTokenStorage.clear()
    }
    this.tokens = undefined
    this.listeners.forEach(l => l.tokensChanged?.())
  }

  private setTokensImpl (tokens: Tokens<C>): void {
    if (this.tokenStorageAsync != null) {
      if (this.tokenStorage == null) {
        throw new Error('tokenStorage is async. Use setTokensAsync method instead')
      }
      this.tokenStorage.store(tokens)
    }
    if (this.persistentTokenStorageAsync != null) {
      if (this.persistentTokenStorage == null) {
        throw new Error('persistentTokenStorage is async. Use setTokensAsync method instead')
      }

      if (this.usePersistentStorage) {
        this.persistentTokenStorage.store(tokens)
      } else {
        this.persistentTokenStorage.clear()
      }
    }
    this.tokens = tokens
    this.listeners.forEach(l => l.tokensChanged?.(this.tokens))
  }

  /**
   * @inheritDoc
   */
  public setTokens (tokens: Tokens<C> | undefined | null): void {
    if (tokens != null) {
      this.setTokensImpl(tokens)
    } else {
      this.unsetTokensImpl()
    }
  }

  /**
   * @inheritDoc
   */
  public async setTokensAsync (tokens: Tokens<C> | undefined | null): Promise<void> {
    if (tokens != null) {
      await this.setTokensImplAsync(tokens)
    } else {
      await this.unsetTokensImplAsync()
    }
  }

  private isExcluded (request: Request, response?: Response): boolean {
    for (const exclude of this.excludes) {
      if (exclude(request, response)) {
        return true
      }
    }
    return false
  }

  /**
   * @inheritDoc
   */
  async interceptRequest (request: Request): Promise<boolean> {
    if (this.isExcluded(request)) {
      return false
    }

    let tokens = this.getTokens()
    const isLoginRequest = await this.isLoginRequest(request)
    if (tokens?.access && !isLoginRequest) {
      if (tokens.refresh != null) {
        const isRenewRequest = await this.isRenewRequest(request)
        if (
          !isRenewRequest &&
          (this.accessTokenDecoder != null) &&
          (this.accessTokenDecoder.isExpired != null) &&
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
        this.serverAdapter.configureRequest(request, tokens)
        return true
      } else {
        this.serverAdapter.configureRequest(request, tokens)
        if (this.accessTokenDecoder?.isExpired?.(tokens.access)) {
          await this.expired()
          throw new Error('Access token is expired')
        }
      }
    }
    return false
  }

  /**
   * @inheritDoc
   */
  async interceptResponse (request: Request, response: Response): Promise<boolean> {
    if (this.isExcluded(request, response)) {
      return false
    }

    const tokens = this.getTokens()
    const refreshToken = tokens?.refresh?.value

    if (refreshToken) {
      const isRenewRequest = await this.isRenewRequest(request)
      if (!isRenewRequest && this.serverAdapter.shouldRenew(request, response)) {
        try {
          await this.renew()
          return true
        } catch (err) {
          await this.expired()
          return false
        }
      } else if (isRenewRequest && this.serverAdapter.isExpired(request, response)) {
        await this.expired()
        return false
      }

      return false
    } else {
      if (this.serverAdapter.shouldRenew(request, response)) {
        await this.expired()
      }
      return false
    }
  }
}
