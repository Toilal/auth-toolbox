import {
  ClientAdapter,
  Request,
  Response,
  ServerAdapter,
  ServerConfiguration,
  ServerEndpoint,
  Tokens,
  UsernamePasswordCredentials
} from '../auth-toolbox'
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

export const openidConnectDiscovery = async <R> (client: ClientAdapter<R>, issuerUrl: string): Promise<ServerConfiguration> => {
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
    if (!tokens.refresh) {
      throw new Error('Refresh token is not defined')
    }

    const rawData = {
      'refresh_token': tokens.refresh.value
    }

    const data = Querystring.stringify(rawData)
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }

    return { ...logoutEndpoint, data, headers }
  }

  asRenewRequest (renewEndpoint: ServerEndpoint, tokens: Tokens): Request {
    if (!tokens.refresh) {
      throw new Error('Refresh token is not defined')
    }

    const rawData = {
      'grant_type': 'refresh_token',
      'refresh_token': tokens.refresh.value
    }

    const data = Querystring.stringify(rawData)
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }

    return { ...renewEndpoint, data, headers }
  }

  getResponseTokens (response: Response): Tokens {
    const loginResponse: LoginResponse = response.data

    if (!loginResponse.access_token) {
      throw new Error('No access token found in response')
    }

    const tokens: Tokens = {
      access: { value: loginResponse.access_token }
    }

    if (loginResponse.expires_in) {
      const expiresAt = new Date()
      expiresAt.setSeconds(expiresAt.getSeconds() + loginResponse.expires_in)
      tokens.access.expiresAt = expiresAt
    }

    if (loginResponse.refresh_token) {
      tokens.refresh = { value: loginResponse.refresh_token }

      if (loginResponse.refresh_expires_in) {
        const expiresAt = new Date()
        expiresAt.setSeconds(expiresAt.getSeconds() + loginResponse.refresh_expires_in)
        tokens.refresh.expiresAt = expiresAt
      }
    }

    return tokens
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
