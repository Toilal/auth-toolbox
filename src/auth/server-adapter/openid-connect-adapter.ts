import {
  ClientAdapter,
  Request,
  Response,
  ServerAdapter,
  ServerConfiguration, ServerEndpoint,
  Tokens,
  UsernamePasswordCredentials
} from '..'
import * as Querystring from 'querystring'

export interface LoginResponse {
  access_token: string,

  expires_in: number,

  'not-before-policy': number,

  'refresh_expires_in': number,

  'refresh_token': string

  session_state: string

  token_type: string
}

export interface OpenidConfiguration {
  issuer: string

  authorization_endpoint: string

  token_endpoint: string

  token_introspection_endpoint: string

  userinfo_endpoint: string

  end_session_endpoint: string

  jwks_uri: string,

  check_session_iframe: string,

  grant_types_supported: string[],

  response_types_supported: string[],

  subject_types_supported: string[],

  id_token_signing_alg_values_supported: string[],

  userinfo_signing_alg_values_supported: string[],

  request_object_signing_alg_values_supported: string[],

  response_modes_supported: string[],

  registration_endpoint: string,

  token_endpoint_auth_methods_supported: string[],

  token_endpoint_auth_signing_alg_values_supported: string[],

  claims_supported: string[],

  claim_types_supported: string[],

  claims_parameter_supported: boolean,

  scopes_supported: string[],

  request_parameter_supported: boolean,

  request_uri_parameter_supported: boolean
}

export const openidConnectDiscovery = <C, Q, R>(client: ClientAdapter<C, Q, R>, issuerUrl: string) => new Promise<ServerConfiguration>((resolve, reject) => {
  return client.request({method: 'GET', url: issuerUrl + '/.well-known/openid-configuration'}).then((r) => {
    const response = client.asResponse(r)
    const openidConfiguration: OpenidConfiguration = response.data
    let serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'POST', url: openidConfiguration.token_endpoint },
      renewEndpoint: { method: 'POST', url: openidConfiguration.token_endpoint },
      logoutEndpoint: { method: 'POST', url: openidConfiguration.end_session_endpoint }
    }
    resolve(serverConfiguration)
    return serverConfiguration
  })
})

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
