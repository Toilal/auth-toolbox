import { Auth } from './auth'

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
   * Check if access token has expired.
   *
   * @param offset Offset in millisecond to apply on browser current date.
   */
  isExpiredAccessToken(offset?: number): boolean | undefined

  /**
   * Check if user is authenticated.
   *
   * @return true if user is authenticated.
   *
   */
  isAuthenticated(): boolean

  /**
   * Add a request type to be excluded from authentication interceptors.
   *
   * @param excludes
   */
  addExclude(...excludes: Exclude[]): void

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

  /**
   * Exclude some requests and responses from interception.
   */
  excludes?: Exclude[]
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

export type Method =
  | 'get'
  | 'GET'
  | 'delete'
  | 'DELETE'
  | 'head'
  | 'HEAD'
  | 'options'
  | 'OPTIONS'
  | 'post'
  | 'POST'
  | 'put'
  | 'PUT'
  | 'patch'
  | 'PATCH'
  | 'purge'
  | 'PURGE'
  | 'link'
  | 'LINK'
  | 'unlink'
  | 'UNLINK'

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
 * It supports performing requests to {@link ServerConfiguration} endpoints, like {@link login} and
 * {@link logout}, but also supports performing authenticated requests throw request method.
 *
 * It can setup {@link RequestInterceptor} and {@link ResponseInterceptor} to automate the
 * authentication on the underlying client.
 *
 * Implementation of this interface can be given to {@link Auth} constructor.
 *
 * @typeparam R Client response type
 */
export interface ClientAdapter<R = any> {
  /**
   * Convert an authorization server login {@link Request} to a client promise that will perform it.
   *
   * @param request
   */
  login(request: Request): Promise<R>

  /**
   * Convert an authorization server renew {@link Request} to a client promise that will perform it.
   *
   * @param request
   */
  renew(request: Request): Promise<R>

  /**
   * Convert an authorization server logout {@link Request} to a client promise that will perform it.
   *
   * @param request
   */
  logout(request: Request): Promise<R>

  /**
   * Convert any resource owner {@link Request} to a client promise that will perform it.
   *
   * @param request
   */
  request(request: Request): Promise<R>

  /**
   * Convert client response to a generic {@link Response}.
   *
   * @param clientResponse
   */
  asResponse(clientResponse: R): Response

  /**
   * Setup a request interceptor that intercept all requests on the underlying client to automate
   * authentication of each requests.
   *
   * @param interceptor
   */
  setupRequestInterceptor(interceptor: RequestInterceptor): () => void

  /**
   * Setup a response interceptor that intercept all responses on the underlying client to automate
   * authentication of each requests.
   *
   * @param interceptor
   */
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
 * Implementation of this interface can be given to {@link Auth} constructor.
 *
 * @param C Credentials type
 */
export interface ServerAdapter<C = UsernamePasswordCredentials> {
  /**
   * Build a login {@link Request} (with credentials).
   *
   * @param loginEndpoint
   * @param credentials
   */
  asLoginRequest(loginEndpoint: ServerEndpoint, credentials: C): Request

  /**
   * Build a renew {@link Request}  (with refresh token).
   *
   * @param renewEndpoint
   * @param refreshToken
   */
  asRenewRequest(renewEndpoint: ServerEndpoint, refreshToken: Token): Request

  /**
   * Build a logout {@link Request} (with refresh token).
   *
   * @param logoutEndpoint
   * @param refreshToken
   */
  asLogoutRequest(logoutEndpoint: ServerEndpoint, refreshToken: Token): Request

  /**
   * Apply the access token to a {@link Request}.
   *
   * It should add `Authorization` header.
   *
   * @param request request to configure
   * @param accessToken access {@link Token.value} to apply.
   */
  setAccessToken(request: Request, accessToken: string | undefined): void

  /**
   * Read tokens from received {@link Response}.
   *
   * @param response received response
   */
  getResponseTokens(response: Response): Tokens<C>

  /**
   * Check if access token has expired from {@link Response}.
   *
   * @param request initial request that leads to the received response
   * @param response received response
   */
  accessTokenHasExpired(request: Request, response: Response): boolean

  /**
   * Check if refresh token has expired from {@link Response}.
   *
   * @param request initial request that leads to the received response
   * @param response received response
   */
  refreshTokenHasExpired(request: Request, response: Response): boolean
}

/**
 * Definition of a server endpoint.
 *
 * ie: `{ method: 'POST', url: '/login' }`
 */
export interface ServerEndpoint {
  method: Method
  url: string
}

/**
 * Configuration of the authentication server, with login, renew and logout endpoints.
 *
 * Only login endpoint declaration is strictly required.
 *
 * If no renewEndpoint is declared, credentials will be stored in TokenStorage to support Renewal.
 * If renewEndpoint is declared, refresh token will be stored in TokenStorage.
 */
export interface ServerConfiguration {
  /**
   * Endpoint for authentication with Credentials.
   */
  loginEndpoint: ServerEndpoint

  /**
   * Endpoint for authentication with Refresh Token.
   */
  renewEndpoint?: ServerEndpoint

  /**
   * Endpoint to terminate session.
   */
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
  isExpired?(token: Token, offset?: number): boolean

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
   * @param err
   */
  initialized?(storageLoaded?: boolean, err?: any): any

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
 * Define a type of request or response to be excluded
 */
export type Exclude = string | RegExp | ((request: Request, response?: Response) => boolean)

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
