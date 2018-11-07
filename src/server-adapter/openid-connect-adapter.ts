import {
  ClientAdapter,
  Request,
  Response,
  ServerAdapter,
  ServerConfiguration,
  ServerEndpoint,
  Token,
  Tokens,
  UsernamePasswordCredentials
} from '..'
import { stringify } from 'querystring'

export interface LoginResponse {
  access_token: string
  expires_in: number
  refresh_expires_in: number
  refresh_token: string
}

export interface OpenidConfiguration {
  token_endpoint: string
  userinfo_endpoint: string
  end_session_endpoint: string
}

/**
 * Provides a {@link ServerConfiguration} through [OpenID discovery](https://openid.net/specs/openid-connect-discovery-1_0.html).
 *
 * It requests `{issuerUrl}/.well-known/openid-configuration` to retrieve login, renew and logout
 * endpoints.
 *
 * It should be given to {@link Auth} constructor.
 *
 * @param client client adapter to request discovery endpoint with.
 * @param issuerUrl url of the authentication realm (without `/.well-known/openid-configuration`).
 */
export async function openidConnectDiscovery<R>(
  client: ClientAdapter<R>,
  issuerUrl: string
): Promise<ServerConfiguration> {
  const clientResponse = await client.request({
    method: 'GET',
    url: issuerUrl + '/.well-known/openid-configuration'
  })
  const response = client.asResponse(clientResponse)
  const openidConfiguration: OpenidConfiguration = response.data
  return {
    loginEndpoint: { method: 'POST', url: openidConfiguration.token_endpoint },
    renewEndpoint: { method: 'POST', url: openidConfiguration.token_endpoint },
    logoutEndpoint: { method: 'POST', url: openidConfiguration.end_session_endpoint }
  }
}

/**
 * Implements OpenID Connect "Resource Owner Password Credentials Grant", it should be given to
 * {@link Auth} constructor.
 */
export default class OpenidConnectAdapter implements ServerAdapter {
  asLoginRequest(loginEndpoint: ServerEndpoint, credentials: UsernamePasswordCredentials): Request {
    const rawData = {
      grant_type: 'password',
      username: credentials.username,
      password: credentials.password
    }

    const data = stringify(rawData)
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }

    return { ...loginEndpoint, data, headers }
  }

  asLogoutRequest(logoutEndpoint: ServerEndpoint, refreshToken: Token): Request {
    const rawData = {
      refresh_token: refreshToken.value
    }

    const data = stringify(rawData)
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }

    return { ...logoutEndpoint, data, headers }
  }

  asRenewRequest(renewEndpoint: ServerEndpoint, refreshToken: Token): Request {
    const rawData = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken.value
    }

    const data = stringify(rawData)
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }

    return { ...renewEndpoint, data, headers }
  }

  getResponseTokens(response: Response): Tokens<UsernamePasswordCredentials> {
    const loginResponse: LoginResponse = response.data

    if (!loginResponse.access_token) {
      throw new Error('No access token found in response')
    }

    const tokens: Tokens<UsernamePasswordCredentials> = {
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

  setAccessToken(request: Request, accessToken: string): void {
    if (!request.headers) {
      request.headers = {}
    }
    request.headers.Authorization = 'Bearer ' + accessToken
  }

  accessTokenHasExpired(request: Request, response: Response): boolean {
    return (
      !!request.headers &&
      !!request.headers.Authorization &&
      response.status === 401 &&
      response.data.error === 'invalid_token'
    )
  }

  refreshTokenHasExpired(request: Request, response: Response): boolean {
    return (
      !!request.headers &&
      !!request.headers.Authorization &&
      response.status === 400 &&
      response.data.error === 'invalid_grant'
    )
  }
}
