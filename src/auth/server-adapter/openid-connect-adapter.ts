import {
  ClientAdapter,
  Request,
  Response,
  ServerAdapter,
  ServerEndpoint,
  Tokens,
  UsernamePasswordCredentials
} from '..'
import * as Querystring from 'querystring'

export interface LoginResponse {
  access_token: string,
  expires_in: number,
  'refresh_expires_in': number,
  'refresh_token': string
}

export interface OpenidConfiguration {
  token_endpoint: string
  userinfo_endpoint: string
  end_session_endpoint: string
}

export const openidConnectDiscovery = async <C, Q, R> (client: ClientAdapter<C, Q, R>, issuerUrl: string) => {
  const clientResponse = await client.request({ method: 'GET', url: issuerUrl + '/.well-known/openid-configuration' })
  const response = client.asResponse(clientResponse)
  const openidConfiguration: OpenidConfiguration = response.data
  return {
    loginEndpoint: { method: 'POST', url: openidConfiguration.token_endpoint },
    renewEndpoint: { method: 'POST', url: openidConfiguration.token_endpoint },
    logoutEndpoint: { method: 'POST', url: openidConfiguration.end_session_endpoint }
  }
}

export default class OpenidConnectAdapter implements ServerAdapter<UsernamePasswordCredentials> {
  asLoginRequest (loginEndpoint: ServerEndpoint, credentials: UsernamePasswordCredentials): Request {
    const rawData = {
      'grant_type': 'password',
      'username': credentials.username,
      'password': credentials.password
    }

    const data = Querystring.stringify(rawData)
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }

    return { ...loginEndpoint, data, headers }
  }

  asLogoutRequest (logoutEndpoint: ServerEndpoint, tokens: Tokens): Request {
    const rawData = {
      'refresh_token': tokens.refreshToken
    }

    const data = Querystring.stringify(rawData)
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }

    return { ...logoutEndpoint, data, headers }
  }

  asRenewRequest (renewEndpoint: ServerEndpoint, tokens: Tokens): Request {
    const rawData = {
      'grant_type': 'refresh_token',
      'refresh_token': tokens.refreshToken
    }

    const data = Querystring.stringify(rawData)
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }

    return { ...renewEndpoint, data, headers }
  }

  getResponseTokens (response: Response): Tokens {
    const loginResponse: LoginResponse = response.data

    let accessTokenExpiresAt: Date | undefined = undefined
    if (loginResponse.expires_in) {
      accessTokenExpiresAt = new Date()
      accessTokenExpiresAt.setSeconds(accessTokenExpiresAt.getSeconds() + loginResponse.expires_in)
    }

    let refreshTokenExpiresAt: Date | undefined = undefined
    if (loginResponse.refresh_expires_in) {
      refreshTokenExpiresAt = new Date()
      refreshTokenExpiresAt.setSeconds(refreshTokenExpiresAt.getSeconds() + loginResponse.refresh_expires_in)
    }

    return {
      accessToken: loginResponse.access_token,
      accessTokenExpiresAt,
      refreshToken: loginResponse.refresh_token,
      refreshTokenExpiresAt
    }
  }

  setAccessToken (request: Request, accessToken: string): void {
    if (!request.headers) {
      request.headers = {}
    }
    request.headers.Authorization = 'Bearer ' + accessToken
  }

  accessTokenHasExpired (request: Request, response: Response): boolean {
    return !!request.headers && !!request.headers.Authorization && response.status === 401 && response.data.error === 'invalid_token'
  }

  refreshTokenHasExpired (request: Request, response: Response): boolean {
    return !!request.headers && !!request.headers.Authorization && response.status === 400 && response.data.error === 'invalid_grant'
  }
}
