import {
  ClientAdapter,
  Request,
  Response,
  ServerAdapter,
  ServerConfiguration,
  Tokens,
  UsernamePasswordCredentials
} from '../auth-toolbox'
// eslint-disable-next-line unicorn/prefer-node-protocol
import { stringify } from 'querystring'

export interface LoginResponse {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  refresh_expires_in?: number
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
export async function openidConnectDiscovery<R> (
  client: ClientAdapter<R>,
  issuerUrl: string
): Promise<ServerConfiguration> {
  let clientResponse: R | null | undefined = null
  try {
    clientResponse = await client.request({
      method: 'GET',
      url: issuerUrl + '/.well-known/openid-configuration'
    })
  } catch (e) {
    if (clientResponse === undefined) {
      throw new Error('OpenId Connect Discovery endpoint return an empty response (hint: maybe a network error)')
    }
    throw e
  }

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
export class OpenidConnectAdapter implements ServerAdapter {
  asLoginRequest (serverConfiguration: ServerConfiguration, credentials: UsernamePasswordCredentials): Request {
    const rawData = {
      grant_type: 'password',
      username: credentials.username,
      password: credentials.password
    }

    const data = stringify(rawData)
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }

    return { ...serverConfiguration.loginEndpoint, data, headers }
  }

  asLogoutRequest (serverConfiguration: ServerConfiguration, tokens: Tokens | undefined): Request | null {
    if (serverConfiguration.logoutEndpoint && tokens?.refresh) {
      const rawData = {
        refresh_token: tokens.refresh.value
      }

      const data = stringify(rawData)
      const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }

      return { ...serverConfiguration.logoutEndpoint, data, headers }
    }

    return null
  }

  asRenewRequest (serverConfiguration: ServerConfiguration, tokens: Tokens | undefined): Request | null {
    if (serverConfiguration.renewEndpoint && tokens?.refresh) {
      const rawData = {
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh.value
      }

      const data = stringify(rawData)
      const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }

      return { ...serverConfiguration.renewEndpoint, data, headers }
    }

    return null
  }

  shouldPersistCredentials (serverConfiguration: ServerConfiguration): boolean {
    return !serverConfiguration.renewEndpoint
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

  configureRequest (request: Request, tokens: Tokens | undefined): void {
    if (tokens?.access) {
      if (!request.headers) {
        request.headers = {}
      }
      request.headers.Authorization = 'Bearer ' + tokens.access.value
    }
  }

  shouldRenew (request: Request, response: Response): boolean {
    return (
      !!request.headers?.Authorization &&
      response.status === 401 &&
      response.data.error === 'invalid_token'
    )
  }

  isExpired (request: Request, response: Response): boolean {
    return (
      !!request.headers?.Authorization &&
      response.status === 400 &&
      response.data.error === 'invalid_grant'
    )
  }
}
