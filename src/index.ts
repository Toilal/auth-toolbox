import Auth from './auth'

export interface IAuth<C = UsernamePasswordCredentials, R = any> {
  loadTokensFromStorage(): Promise<Tokens<C> | undefined>

  release(): void

  login(credentials: C, saveTokens?: boolean): Promise<R>

  logout(stop?: boolean): Promise<R | void>

  renew(): Promise<R | void>

  getTokens(): Tokens<C> | undefined

  setTokens(tokens: Tokens<C> | undefined | null): Promise<void> | void

  decodeAccessToken(): any | undefined

  isAuthenticated(): boolean

  addListener(...listeners: AuthListener[]): void

  removeListener(...listeners: AuthListener[]): void
}

export interface RequestInterceptor {
  interceptRequest(request: Request): boolean | Promise<boolean>
}

export interface ResponseInterceptor {
  interceptResponse(request: Request, response: Response): boolean | Promise<boolean>
}

export interface Request extends ServerEndpoint {
  data?: any
  headers?: { [key: string]: string }
}

export interface Response {
  data?: any
  headers?: { [key: string]: string }
  status?: number
}

export interface ClientAdapter<R = any> {
  login(request: Request): Promise<R>

  renew(request: Request): Promise<R>

  logout(request: Request): Promise<R>

  request(request: Request): Promise<R>

  asResponse(clientResponse: R): Response

  setupRequestInterceptor(interceptor: RequestInterceptor): () => void

  setupErrorResponseInterceptor(interceptor: ResponseInterceptor): () => void
}

export interface ServerAdapter<C = UsernamePasswordCredentials> {
  asLoginRequest(loginEndpoint: ServerEndpoint, credentials: C): Request

  asRenewRequest(renewEndpoint: ServerEndpoint, refreshToken: Token): Request

  asLogoutRequest(logoutEndpoint: ServerEndpoint, refreshToken: Token): Request

  setAccessToken(request: Request, accessToken: string | undefined): void

  getResponseTokens(response: Response): Tokens<C>

  accessTokenHasExpired(request: Request, response: Response): boolean

  refreshTokenHasExpired(request: Request, response: Response): boolean
}

export interface ServerEndpoint {
  method: string
  url: string
}

export interface ServerConfiguration {
  loginEndpoint: ServerEndpoint
  renewEndpoint?: ServerEndpoint
  logoutEndpoint?: ServerEndpoint
}

export interface Token {
  value: string
  expiresAt?: Date
}

export interface Tokens<C = UsernamePasswordCredentials> {
  access: Token
  refresh?: Token
  credentials?: C
}

export interface TokenDecoder {
  isExpired?(token: Token): boolean

  decode?(token: Token): any | undefined
}

export interface AuthListener {
  tokensChanged?<C = UsernamePasswordCredentials>(tokens?: Tokens<C>): any

  expired?(): any

  login?(): any

  logout?(): any

  renew?(): any
}

export interface TokenStorage {
  store<C>(tokens: Tokens<C>): void | Promise<void>

  clear(): void | Promise<void>

  getTokens<C>(): Tokens<C> | undefined | Promise<Tokens<C> | undefined>
}

export interface UsernamePasswordCredentials {
  username: string
  password: string
}

export default Auth
