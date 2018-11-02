import { IAuth, Tokens, TokenStorage } from './/index'
import Auth from './auth'

export interface IAuth<C, R> {
  init (): Promise<void>

  getTokens (): Tokens | undefined

  isAuthenticated (): boolean

  login (credentials: C, saveCredentials?: boolean): Promise<R>

  logout (stop?: boolean): Promise<R | void>

  renew (): Promise<R>

  addListeners (...listeners: AuthListener[]): void

  removeListeners (...listeners: AuthListener[]): void
}

export interface IAuthInternals<C, Q, R> extends IAuth<C, R> {
  serverAdapter: ServerAdapter<C>
  serverConfiguration: ServerConfiguration | Promise<ServerConfiguration>
  clientAdapter: ClientAdapter<C, Q, R>
  tokenStorage?: TokenStorage
  persistentTokenStorage?: TokenStorage
  listeners: AuthListener[]

  unsetTokens (): void

  setTokens (tokens: Tokens): void

  expired (): void

  isLoginRequest (request: Request): boolean | Promise<boolean>

  isRenewRequest (request: Request): boolean | Promise<boolean>

  interceptRequest (request: Request): boolean | Promise<boolean>

  interceptErrorResponse (request: Request, response: Response): boolean | Promise<boolean>
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

export interface ClientAdapter<C, Q, R> {
  login (request: Request): Promise<R>

  renew (request: Request): Promise<R>

  logout (request: Request): Promise<R>

  request (request: Request): Promise<R>

  asResponse (clientResponse: R): Response

  init (auth: IAuthInternals<C, Q, R>): any
}

export interface ServerAdapter<C> {
  asLoginRequest (loginEndpoint: ServerEndpoint, credentials: C): Request

  asRenewRequest (renewEndpoint: ServerEndpoint, tokens: Tokens): Request

  asLogoutRequest (logoutEndpoint: ServerEndpoint, tokens: Tokens): Request

  setAccessToken (request: Request, accessToken: string | undefined): void

  getResponseTokens (response: Response): Tokens

  accessTokenHasExpired (request: Request, response: Response): boolean

  refreshTokenHasExpired (request: Request, response: Response): boolean
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
  value: string,
  expiresAt?: Date,
}

export interface Tokens {
  access: Token
  refresh?: Token
}

export interface TokenDecoder {
  isExpired (token: Token): boolean

  decode? (token: Token): object | undefined
}

export interface AuthListener {
  initialized? (): any

  tokensChanged? (tokens?: Tokens): any

  expired? (): any

  login? (): any

  logout? (): any

  renew? (): any
}

export interface TokenStorage {
  store (tokens: Tokens): void | Promise<void>

  clear (): void | Promise<void>

  getTokens (): Tokens | undefined | Promise<Tokens | undefined>
}

export interface UsernamePasswordCredentials {
  username: string
  password: string
}

export default Auth
