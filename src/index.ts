import Auth from './auth'

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
export interface IAuth<C = UsernamePasswordCredentials, R = any> {
  /**
   * Define if tokens should be stored in persistent storage.
   */
  usePersistentStorage: boolean

  /**
   * Check if underlying storage is synchronous.
   */
  readonly storageSync: boolean

  /**
   * Load tokens from storage synchronously.
   *
   * @return Loaded tokens
   * @throws Error when underlying storage is not synchronous.
   * @see {@link storageSync}
   *
   */
  loadTokensFromStorage(): Tokens<C> | undefined

  /**
   * Load tokens from storage asynchronously.
   *
   * @return Loaded tokens
   */
  loadTokensFromStorageAsync(): Promise<Tokens<C> | undefined>

  /**
   * Release any resource associated with IAuth
   */
  release(): void

  /**
   * Authenticate the user with given credentials.
   *
   * @param credentials Credentials to use.
   *
   * @return Client response if it has occured.
   * @throws Error if fail to renew tokens.
   *
   */
  login(credentials: C): Promise<R>

  /**
   * Forget the user authentication.
   *
   * @return Client response if it has occured.
   * @throws Error if fail to renew tokens.
   */
  logout(): Promise<R | void>

  /**
   * Renew tokens.
   *
   * @return Client response if it has occured.
   * @throws Error if fail to renew tokens.
   */
  renew(): Promise<R | void>

  /**
   * Get current stored tokens.
   *
   * @return current stored tokens.
   */
  getTokens(): Tokens<C> | undefined

  /**
   * Manually store tokens synchronously. It may be used to authenticated a user with a token
   * instead of using login with credentials.
   *
   * @param tokens Tokens to save.
   * @throws Error when underlying storage is not synchronous.
   * @see {@link storageSync}
   */
  setTokens(tokens: Tokens<C> | undefined | null): void

  /**
   * Manually store tokens asynchronously. It may be used to authenticated a user with a token
   * instead of using login with credentials.
   *
   * @param tokens Tokens to save.
   */
  setTokensAsync(tokens: Tokens<C> | undefined | null): Promise<void>

  /**
   * Decode the access token from Tokens if defined.
   *
   * @return The decoded access token payload.
   */
  decodeAccessToken(): any | undefined

  /**
   * Check if user is authenticated.
   *
   * @return true if user is authenticated.
   *
   */
  isAuthenticated(): boolean

  /**
   * Add one or more listeners.
   *
   * @param listeners
   */
  addListener(...listeners: AuthListener[]): void

  /**
   * Remove one or more listeners.
   *
   * @param listeners
   */
  removeListener(...listeners: AuthListener[]): void
}

/**
 * Options that can be defined on {@link Auth} constructor.
 */
export interface AuthOptions {
  /**
   * Access token decoder.
   *
   * @default new DefaultTokenDecoder()
   */
  accessTokenDecoder?: TokenDecoder | null

  /**
   * Token storage used to load and store {Tokens} without any persistence.
   *
   * Stored Tokens should not survive a browser restart.
   *
   * @default new DefaultTokenStorage(sessionStorage)
   */
  tokenStorage?: TokenStorage | TokenStorageAsync | null

  /**
   * Token storage used to load and store Tokens with persistence.
   *
   * Stored Tokens should survive a browser restart.
   *
   * @default new DefaultTokenStorage(localStorage)
   */
  persistentTokenStorage?: TokenStorage | TokenStorageAsync | null

  /**
   * Listeners to add at construction.
   */
  listeners?: AuthListener[] | null

  /**
   * Automatically load Tokens from both TokenStorage at initialization.
   *
   * @default true if both TokenStorage are synchronous, false if asynchronous.
   */
  loadTokensFromStorage?: boolean | null

  /**
   * Setup interceptors at initialization.
   *
   * @default true
   */
  clientInterceptors?: boolean
}

/**
 * Intercept request to automate authentication support.
 *
 * It check Tokens expiration and handle {@link Tokens} renewal if required.
 */
export interface RequestInterceptor {
  interceptRequest(request: Request): boolean | Promise<boolean>
}

/**
 * Intercept response to automate authentication support.
 *
 * It check server response and handle {@link Tokens} renewal if required.
 */
export interface ResponseInterceptor {
  interceptResponse(request: Request, response: Response): boolean | Promise<boolean>
}

/**
 * A simple HTTP request abstraction that aims to be common for any HTTP client.
 *
 * @see {@link ClientAdapter}
 */
export interface Request extends ServerEndpoint {
  data?: any
  headers?: { [key: string]: string }
}

/**
 * A simple HTTP response abstraction that aims to be common for any HTTP client.
 *
 * @see {@link ClientAdapter}
 */
export interface Response {
  data?: any
  headers?: { [key: string]: string }
  status?: number
}

/**
 * Adapts HTTP client to common objects like Request and Response.
 *
 * It supports performing requests to {@link ServerConfiguration} endpoints, like login, renew and logout,
 * but also supports performing applications requests throw request method.
 *
 * It can setup {@link RequestInterceptor} and {@link ResponseInterceptor} to automate the
 * authentication on the underlying client.
 *
 * @typeparam R Client response type
 */
export interface ClientAdapter<R = any> {
  login(request: Request): Promise<R>

  renew(request: Request): Promise<R>

  logout(request: Request): Promise<R>

  request(request: Request): Promise<R>

  asResponse(clientResponse: R): Response

  setupRequestInterceptor(interceptor: RequestInterceptor): () => void

  setupErrorResponseInterceptor(interceptor: ResponseInterceptor): () => void
}

/**
 * Adapts HTTP authentication server to common objects like {@link ServerEndpoint} and
 * {@link Request}.
 *
 * It supports creating login, renew and logout requests based on supported protocol (OAuth, OpenID,
 * custom JWT authentication ...).
 *
 * It also supports setting the access token on any {@link Request}, reading {@link Tokens} from
 * {@link Response}, and checking if {@link Tokens.access} or {@link Tokens.refresh} have expired
 * from {@link Response}.
 *
 * @param C Credentials type
 */
export interface ServerAdapter<C = UsernamePasswordCredentials> {
  asLoginRequest(loginEndpoint: ServerEndpoint, credentials: C): Request

  asRenewRequest(renewEndpoint: ServerEndpoint, refreshToken: Token): Request

  asLogoutRequest(logoutEndpoint: ServerEndpoint, refreshToken: Token): Request

  setAccessToken(request: Request, accessToken: string | undefined): void

  getResponseTokens(response: Response): Tokens<C>

  accessTokenHasExpired(request: Request, response: Response): boolean

  refreshTokenHasExpired(request: Request, response: Response): boolean
}

/**
 * Definition of a server endpoint.
 *
 * ie: `{ method: 'POST', url: '/login' }`
 */
export interface ServerEndpoint {
  method: string
  url: string
}

/**
 * Configuration of the authentication server, with login, renew and logout endpoints.
 *
 * Only login endpoint declaration is strictly required.
 *
 * If no renewEndpoint is declared, credentials will be stored in TokenStorage to support Renewal.
 * If renewEndpoint is declared, refresh token will be stored in TokenStorage
 */
export interface ServerConfiguration {
  loginEndpoint: ServerEndpoint
  renewEndpoint?: ServerEndpoint
  logoutEndpoint?: ServerEndpoint
}

/**
 * A Token contains a value (Encrypted JWT Token, ...) and an optional expiration date (sometimes
 * provided by the authentication server).
 */
export interface Token {
  value: string
  expiresAt?: Date
}

/**
 * Tokens contains at least an access {@link Token}. It may also contain a refresh {@link Token},
 * and raw Credentials.
 *
 * @param C Credentials type
 */
export interface Tokens<C = UsernamePasswordCredentials> {
  access: Token
  refresh?: Token
  credentials?: C
}

/**
 * Supports decoding a token and checking if it is expired.
 */
export interface TokenDecoder {
  isExpired?(token: Token): boolean

  decode?(token: Token): any | undefined
}

/**
 * Implement this interface to listen to various events.
 *
 * Implementations should be given to {@link Auth} constructor through
 * {@link AuthOptions.listeners}, or added on existing an {@link Auth} instance with
 * {@link IAuth.addListener}
 */
export interface AuthListener {
  /**
   * Called when IAuth is initialized.
   *
   * @param storageLoaded
   */
  initialized?(storageLoaded?: boolean): any

  /**
   * Called when Tokens changes.
   *
   * @typeparam C Credentials type
   * @param tokens
   */
  tokensChanged?<C = UsernamePasswordCredentials>(tokens?: Tokens<C>): any

  /**
   * Called when Tokens is expired.
   */
  expired?(): any

  /**
   * Called when login has been performed.
   */
  login?(): any

  /**
   * Called when logout has been performed.
   */
  logout?(): any

  /**
   * Called when Tokens have been renewed.
   */
  renew?(): any
}

/**
 * TokenStorage can load and store {@link Tokens} synchronously.
 */
export interface TokenStorage {
  readonly async: false

  /**
   * Store tokens
   *
   * @typeparam C Credentials type
   * @param tokens
   */
  store<C>(tokens: Tokens<C>): void

  /**
   * Remove existing tokens
   */
  clear(): void

  /**
   * Load tokens
   *
   * @typeparam C Credentials type
   */
  getTokens<C>(): Tokens<C> | undefined
}

/**
 * TokenStorageAsync can load and store {@link Tokens} asynchrously.
 */
export interface TokenStorageAsync {
  readonly async: true

  readonly sync?: TokenStorage

  /**
   * Store tokens
   *
   * @typeparam C Credentials type
   * @param tokens
   */
  store<C>(tokens: Tokens<C>): Promise<void>

  /**
   * Remove existing tokens
   */
  clear(): Promise<void>

  /**
   * Load tokens
   *
   * @typeparam C Credentials type
   */
  getTokens<C>(): Promise<Tokens<C> | undefined>
}

/**
 * The most common credentials composed of a username and a password.
 */
export interface UsernamePasswordCredentials {
  username: string
  password: string
}

export default Auth
