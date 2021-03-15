import {
  AxiosAdapter,
  LoginResponse,
  OpenidConnectAdapter,
  openidConnectDiscovery,
  Request,
  Response
} from '../../src'

import axios from 'axios'
import { advanceTo, clear } from 'jest-date-mock'
import MockAdapter from 'axios-mock-adapter'
import { ServerConfiguration, Tokens } from '../../dist/lib'

describe('Openid Connect Adapter - Discovery', () => {
  it('build configuration from /.well-known/openid-configuration', async () => {
    const axiosInstance = axios.create()

    // This sets the mock adapter on the default instance
    const axiosMock = new MockAdapter(axiosInstance)

    // Mock any GET request to /users
    // arguments for reply are (status, data, headers)
    axiosMock.onGet('issuer/.well-known/openid-configuration').reply(200, {
      token_endpoint: 'tokenEndpoint',
      end_session_endpoint: 'endSessionEndpoint'
    })

    const axiosAdapter = new AxiosAdapter(axiosInstance)
    const configuration = await openidConnectDiscovery(axiosAdapter, 'issuer')

    expect(configuration.loginEndpoint).toEqual({ method: 'POST', url: 'tokenEndpoint' })
    expect(configuration.renewEndpoint).toEqual({ method: 'POST', url: 'tokenEndpoint' })
    expect(configuration.logoutEndpoint).toEqual({ method: 'POST', url: 'endSessionEndpoint' })

    return configuration
  })
})

describe('Openid Connect Adapter', () => {
  beforeEach(() => {
    advanceTo(133713371337)
  })

  afterEach(() => {
    clear()
  })

  it('default module is defined', () => {
    expect(OpenidConnectAdapter).toBeDefined()
  })

  it('adapts login request', () => {
    const adapter = new OpenidConnectAdapter()

    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: {
        method: 'POST',
        url: 'url'
      }
    }
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
    const username = 'testUsername'
    const password = 'testPassword'

    const loginRequest = adapter.asLoginRequest(serverConfiguration, { username, password })
    expect(loginRequest.method).toBe(serverConfiguration.loginEndpoint.method)
    expect(loginRequest.url).toBe(serverConfiguration.loginEndpoint.url)
    expect(loginRequest.headers).toEqual(headers)
    expect(loginRequest.data).toBe(`grant_type=password&username=${username}&password=${password}`)
  })

  it('adapts logout request', () => {
    const adapter = new OpenidConnectAdapter()

    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: {
        method: 'POST',
        url: 'loginUrl'
      },
      logoutEndpoint: {
        method: 'POST',
        url: 'logoutUrl'
      }
    }

    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
    const tokens: Tokens = {
      access: {
        value: 'testAccessToken'
      },
      refresh: {
        value: 'testRefreshToken'
      }
    }

    const logoutRequest = adapter.asLogoutRequest(serverConfiguration, tokens)
    expect(logoutRequest).not.toBeFalsy()
    if (logoutRequest) {
      expect(logoutRequest.method).toBe(serverConfiguration.logoutEndpoint!.method)
      expect(logoutRequest.url).toBe(serverConfiguration.logoutEndpoint!.url)
      expect(logoutRequest.headers).toEqual(headers)
      expect(logoutRequest.data).toBe(`refresh_token=${tokens.refresh!.value}`)
    }
  })

  it('adapts renew request', () => {
    const adapter = new OpenidConnectAdapter()

    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: {
        method: 'POST',
        url: 'loginUrl'
      }
    }

    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
    const tokens: Tokens = {
      access: {
        value: 'testAccessToken'
      },
      refresh: {
        value: 'testRefreshToken'
      }
    }

    const renewRequest = adapter.asRenewRequest(serverConfiguration, tokens)
    if (renewRequest) {
      expect(renewRequest.method).toBe(serverConfiguration.renewEndpoint!.method)
      expect(renewRequest.url).toBe(serverConfiguration.renewEndpoint!.url)
      expect(renewRequest.headers).toEqual(headers)
      expect(renewRequest.data).toBe(`grant_type=refresh_token&refresh_token=${tokens.refresh!.value}`)
    }
  })

  it('retrieves tokens from response without expires', () => {
    const adapter = new OpenidConnectAdapter()

    const response: Response = {
      data: {
        access_token: 'accessToken',
        refresh_token: 'refreshToken'
      } as LoginResponse
    }

    const tokens = adapter.getResponseTokens(response)

    expect(tokens.access).toEqual({ value: response.data.access_token })
    expect(tokens.refresh).toBeDefined()
    if (tokens.refresh) {
      expect(tokens.refresh).toEqual({ value: response.data.refresh_token })
    }
  })

  it('retrieves tokens from response with expires', () => {
    const adapter = new OpenidConnectAdapter()

    const response: Response = {
      data: {
        access_token: 'accessToken',
        refresh_token: 'refreshToken',
        expires_in: 30,
        refresh_expires_in: 45
      } as LoginResponse
    }

    const tokens = adapter.getResponseTokens(response)

    const expiresAt = new Date()
    const refreshExpiresAt = new Date()

    expiresAt.setSeconds(expiresAt.getSeconds() + response.data.expires_in)
    refreshExpiresAt.setSeconds(refreshExpiresAt.getSeconds() + response.data.refresh_expires_in)

    expect(tokens.access).toEqual({ value: response.data.access_token, expiresAt })
    expect(tokens.refresh).toBeDefined()
    if (tokens.refresh) {
      expect(tokens.refresh).toEqual({
        value: response.data.refresh_token,
        expiresAt: refreshExpiresAt
      })
    }
  })

  it('set access token on request', () => {
    const adapter = new OpenidConnectAdapter()

    const request: Request = { method: 'GET', url: 'url' }
    const tokens: Tokens = {
      access: {
        value: 'testAccessToken'
      }
    }

    adapter.configureRequest(request, tokens)

    expect(request.headers).toEqual({ Authorization: `Bearer ${tokens.access.value}` })
  })

  it('set access token on request with custom headers', () => {
    const adapter = new OpenidConnectAdapter()

    const request: Request = { method: 'GET', url: 'url', headers: { dummy: 'testDummy' } }
    const tokens: Tokens = {
      access: {
        value: 'testAccessToken'
      }
    }

    adapter.configureRequest(request, tokens)

    expect(request.headers).toEqual({
      Authorization: `Bearer ${tokens.access.value}`,
      dummy: 'testDummy'
    })
  })

  it('accessTokenHasExpired returns false when authorization header is not present in request', () => {
    const adapter = new OpenidConnectAdapter()

    const request: Request = { method: 'GET', url: 'url' }
    const response: Response = { status: 401, data: { error: 'invalid_token' } }

    const expired = adapter.shouldRenew(request, response)
    expect(expired).toBeFalsy()
  })

  it('accessTokenHasExpired returns true when authorization header is present in request', () => {
    const adapter = new OpenidConnectAdapter()

    const request: Request = {
      method: 'GET',
      url: 'url',
      headers: { Authorization: 'Bearer accessToken' }
    }
    const response: Response = { status: 401, data: { error: 'invalid_token' } }

    const expired = adapter.shouldRenew(request, response)
    expect(expired).toBeTruthy()
  })

  it('refreshTokenHasExpired returns false when authorization header is not present in request', () => {
    const adapter = new OpenidConnectAdapter()

    const request: Request = { method: 'GET', url: 'url' }
    const response: Response = { status: 400, data: { error: 'invalid_grant' } }

    const expired = adapter.isExpired(request, response)
    expect(expired).toBeFalsy()
  })

  it('refreshTokenHasExpired returns true when authorization header is present in request', () => {
    const adapter = new OpenidConnectAdapter()

    const request: Request = {
      method: 'GET',
      url: 'url',
      headers: { Authorization: 'Bearer accessToken' }
    }
    const response: Response = { status: 400, data: { error: 'invalid_grant' } }

    const expired = adapter.isExpired(request, response)
    expect(expired).toBeTruthy()
  })
})
