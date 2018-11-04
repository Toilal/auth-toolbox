import OpenidConnectAdapter, {
  LoginResponse,
  openidConnectDiscovery
} from '../../../src/auth/server-adapter/openid-connect-adapter'

import AxiosAdapter from '../../../src/auth/client-adapter/axios-adapter'
import axios from 'axios'

import { advanceTo, clear } from 'jest-date-mock'

import MockAdapter from 'axios-mock-adapter'
import { Request, Response } from '../../../src/auth'

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

    const method = 'POST'
    const url = 'url'
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
    const username = 'testUsername'
    const password = 'testPassword'

    const loginRequest = adapter.asLoginRequest({ url, method }, { username, password })
    expect(loginRequest.method).toBe(method)
    expect(loginRequest.url).toBe(url)
    expect(loginRequest.headers).toEqual(headers)
    expect(loginRequest.data).toBe(`grant_type=password&username=${username}&password=${password}`)
  })

  it('adapts logout request', () => {
    const adapter = new OpenidConnectAdapter()

    const method = 'POST'
    const url = 'url'
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
    const access = { value: 'testAccessToken' }
    const refresh = { value: 'testRefreshToken' }

    const loginRequest = adapter.asLogoutRequest({ url, method }, { access, refresh })
    expect(loginRequest.method).toBe(method)
    expect(loginRequest.url).toBe(url)
    expect(loginRequest.headers).toEqual(headers)
    expect(loginRequest.data).toBe(`refresh_token=${refresh.value}`)
  })

  it('adapts renew request', () => {
    const adapter = new OpenidConnectAdapter()

    const method = 'POST'
    const url = 'url'
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
    const access = { value: 'testAccessToken' }
    const refresh = { value: 'testRefreshToken' }

    const loginRequest = adapter.asRenewRequest({ url, method }, { access, refresh })
    expect(loginRequest.method).toBe(method)
    expect(loginRequest.url).toBe(url)
    expect(loginRequest.headers).toEqual(headers)
    expect(loginRequest.data).toBe(`grant_type=refresh_token&refresh_token=${refresh.value}`)
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
      expect(tokens.refresh).toEqual({ value: response.data.refresh_token, expiresAt: refreshExpiresAt })
    }
  })

  it('set access token on request', () => {
    const adapter = new OpenidConnectAdapter()

    const request: Request = { method: 'GET', url: 'url' }
    const accessToken = 'testAccessToken'

    adapter.setAccessToken(request, accessToken)

    expect(request.headers).toEqual({ Authorization: `Bearer ${accessToken}` })
  })

  it('set access token on request with custom headers', () => {
    const adapter = new OpenidConnectAdapter()

    const request: Request = { method: 'GET', url: 'url', headers: { dummy: 'testDummy' } }
    const accessToken = 'testAccessToken'

    adapter.setAccessToken(request, accessToken)

    expect(request.headers).toEqual({ Authorization: `Bearer ${accessToken}`, dummy: 'testDummy' })
  })

  it('accessTokenHasExpired returns false when authorization header is not present in request', () => {
    const adapter = new OpenidConnectAdapter()

    const request: Request = { method: 'GET', url: 'url' }
    const response: Response = { status: 401, data: { error: 'invalid_token' } }

    const expired = adapter.accessTokenHasExpired(request, response)
    expect(expired).toBeFalsy()
  })

  it('accessTokenHasExpired returns true when authorization header is present in request', () => {
    const adapter = new OpenidConnectAdapter()

    const request: Request = { method: 'GET', url: 'url', headers: { 'Authorization': 'Bearer accessToken' } }
    const response: Response = { status: 401, data: { error: 'invalid_token' } }

    const expired = adapter.accessTokenHasExpired(request, response)
    expect(expired).toBeTruthy()
  })

  it('refreshTokenHasExpired returns false when authorization header is not present in request', () => {
    const adapter = new OpenidConnectAdapter()

    const request: Request = { method: 'GET', url: 'url' }
    const response: Response = { status: 400, data: { error: 'invalid_grant' } }

    const expired = adapter.refreshTokenHasExpired(request, response)
    expect(expired).toBeFalsy()
  })

  it('refreshTokenHasExpired returns true when authorization header is present in request', () => {
    const adapter = new OpenidConnectAdapter()

    const request: Request = { method: 'GET', url: 'url', headers: { 'Authorization': 'Bearer accessToken' } }
    const response: Response = { status: 400, data: { error: 'invalid_grant' } }

    const expired = adapter.refreshTokenHasExpired(request, response)
    expect(expired).toBeTruthy()
  })
})
