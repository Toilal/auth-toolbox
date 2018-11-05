import Auth from './auth'

export interface IAuth<C, R> {
  loadTokensFromStorage(): Promise<Tokens | undefined>

  release(): void

  login(credentials: C, saveTokens?: boolean): Promise<R>

  logout(stop?: boolean): Promise<R | void>

  renew(): Promise<R | void>

  getTokens(): Tokens | undefined

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

export interface ClientAdapter<R> {
  login(request: Request): Promise<R>

  renew(request: Request): Promise<R>

  logout(request: Request): Promise<R>

  request(request: Request): Promise<R>

  asResponse(clientResponse: R): Response

  setupRequestInterceptor(interceptor: RequestInterceptor): () => void

  setupErrorResponseInterceptor(interceptor: ResponseInterceptor): () => void
}

export interface ServerAdapter<C> {
  asLoginRequest(loginEndpoint: ServerEndpoint, credentials: C): Request

  asRenewRequest(renewEndpoint: ServerEndpoint, refreshToken: Token): Request

  asLogoutRequest(logoutEndpoint: ServerEndpoint, refreshToken: Token): Request

  setAccessToken(request: Request, accessToken: string | undefined): void

  getResponseTokens(response: Response): Tokens

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

export interface Tokens<C = any> {
  access: Token
  refresh?: Token
  credentials?: C
}

export interface TokenDecoder {
  isExpired?(token: Token): boolean

  decode?(token: Token): any | undefined
}

export interface AuthListener {
  tokensChanged?(tokens?: Tokens): any

  expired?(): any

  login?(): any

  logout?(): any

  renew?(): any
}

export interface TokenStorage {
  store(tokens: Tokens): void | Promise<void>

  clear(): void | Promise<void>

  getTokens(): Tokens | undefined | Promise<Tokens | undefined>
}

export interface UsernamePasswordCredentials {
  username: string
  password: string
}

export default Auth
