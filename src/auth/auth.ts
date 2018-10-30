import {
  AuthListener,
  ClientAdapter,
  IAuthInternals, Request,
  ServerAdapter,
  ServerConfiguration,
  Tokens,
  TokenStorage
} from '.'

export default class Auth<C, Q, R> implements IAuthInternals<C, Q, R> {
  serverAdapter: ServerAdapter<C>
  serverConfiguration: ServerConfiguration | Promise<ServerConfiguration>
  clientAdapter: ClientAdapter<C, Q, R>
  tokenStorage?: TokenStorage
  persistentTokenStorage?: TokenStorage
  listeners: AuthListener[] = []

  private tokens?: Tokens
  private saveCredentials: boolean = false

  private renewRunning: boolean = false
  private renewPromises: { promise: Promise<any>, resolve: any, reject: any }[] = []
  private _serverConfiguration: any

  constructor (serverConfiguration: ServerConfiguration | Promise<ServerConfiguration>,
               serverAdapter: ServerAdapter<C>,
               clientAdapter: ClientAdapter<C, Q, R>,
               tokenStorage?: TokenStorage,
               persistentTokenStorage?: TokenStorage) {
    this.serverConfiguration = serverConfiguration
    this.serverAdapter = serverAdapter
    this.clientAdapter = clientAdapter
    this.tokenStorage = tokenStorage
    this.persistentTokenStorage = persistentTokenStorage
  }

  async init () {
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
    }

    const serverConfiguration = await this.serverConfiguration
    this._serverConfiguration = serverConfiguration

    this.clientAdapter.init(this)
    this.listeners.forEach(l => l.initialized && l.initialized())
  }

  addListeners (...listeners: AuthListener[]) {
    this.listeners.push(...listeners)
  }

  getTokens (): Tokens | undefined {
    return this.tokens
  }

  get accessToken (): string | undefined {
    return this.tokens ? this.tokens.accessToken : undefined
  }

  get refreshToken (): string | undefined {
    return this.tokens ? this.tokens.refreshToken : undefined
  }

  isSaveCredentials (): boolean {
    return this.saveCredentials
  }

  isAuthenticated (): boolean {
    return !!this.tokens
  }

  async getServerConfiguration (): Promise<ServerConfiguration> {
    if (this._serverConfiguration) {
      return this._serverConfiguration
    }
    const serverConfiguration = await this.serverConfiguration
    this._serverConfiguration = serverConfiguration
    return serverConfiguration
  }

  async isLoginRequest (request: Request) {
    const serverConfiguration = await this.getServerConfiguration();
    if (serverConfiguration.loginEndpoint &&
      serverConfiguration.loginEndpoint.method === request.method &&
      serverConfiguration.loginEndpoint.url === request.url) {
      return true;
    }
    return false;
  }

  async isRenewRequest (request: Request) {
    const serverConfiguration = await this.getServerConfiguration();
    if (serverConfiguration.renewEndpoint &&
      serverConfiguration.renewEndpoint.method === request.method &&
      serverConfiguration.renewEndpoint.url === request.url) {
      return true;
    }
    return false;
  }

  async login (credentials: C, saveCredentials?: boolean): Promise<R> {
    const serverConfiguration = await this.getServerConfiguration()
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

  async renew (): Promise<R> {
    if (!this.tokens) {
      throw new Error("Token is not available")
    }
    if (!this.renewRunning) {
      try {
        this.renewRunning = true
        const serverConfiguration = await this.getServerConfiguration()
        if (!serverConfiguration.renewEndpoint) {
          throw new Error("Renew endpoint is not configured")
        }
        const request = this.serverAdapter.asRenewRequest(serverConfiguration.renewEndpoint, this.tokens)
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

  async logout (): Promise<R | void> {
    if (!this.tokens) throw new Error("Token is not available")
    let response
    const serverConfiguration = await this.getServerConfiguration()
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

  public async expired () {
    await this.unsetTokens()
    this.listeners.forEach(l => l.expired && l.expired())
  }

  public async unsetTokens () {
    this.tokens = undefined
    if (this.persistentTokenStorage) {
      await this.persistentTokenStorage.clear()
    }
    if (this.tokenStorage) {
      await this.tokenStorage.clear()
    }
    this.listeners.forEach(l => l.tokensChanged && l.tokensChanged())
  }

  public async setTokens (tokens: Tokens) {
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
}
