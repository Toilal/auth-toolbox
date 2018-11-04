import Auth, { AuthListener, ServerConfiguration } from '../../src/auth'
import AxiosAdapter from '../../src/auth/client-adapter/axios-adapter'
import axios from 'axios'
import OpenidConnectAdapter, { LoginResponse } from '../../src/auth/server-adapter/openid-connect-adapter'
import MockAdapter from 'axios-mock-adapter'

describe('Auth', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('default module is defined', () => {
    expect(Auth).toBeDefined()
  })

  it('init loads token from session storage', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    sessionStorage.setItem('auth.accessToken', 'accessTokenValue')

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter)
    await auth.loadTokensFromStorage()

    const token = auth.getTokens()
    expect(token).toBeDefined()
    if (token) {
      expect(token.access.value).toBe('accessTokenValue')
      expect(token.refresh).toBeUndefined()
    }

    expect(localStorage.getItem('auth.accessToken')).toBe(null)

    return null
  })

  it('init loads token from local storage', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    localStorage.setItem('auth.accessToken', 'accessTokenValue')

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter)
    await auth.loadTokensFromStorage()

    const token = auth.getTokens()
    expect(token).toBeDefined()
    if (token) {
      expect(token.access.value).toBe('accessTokenValue')
      expect(token.refresh).toBeUndefined()
    }

    expect(sessionStorage.getItem('auth.accessToken')).toBe('accessTokenValue')

    return null
  })

  it('init does not fail when no token storage is defined', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    localStorage.setItem('auth.accessToken', 'accessTokenValue')

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, null, null, null)
    await auth.loadTokensFromStorage()

    return null
  })

  it('init does not fail when only SessionStorageAdapter is defined', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    localStorage.setItem('auth.accessToken', 'accessTokenValue')

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, undefined, undefined, null)
    await auth.loadTokensFromStorage()

    const token = auth.getTokens()
    expect(token).toBeUndefined()

    expect(sessionStorage.getItem('auth.accessToken')).toBeNull()

    return null
  })

  it('init updates localStorage from sessionStorage', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    sessionStorage.setItem('auth.accessToken', 'accessTokenValue')
    localStorage.setItem('auth.accessToken', 'accessTokenValueDummy')

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter)
    const r = await auth.loadTokensFromStorage()

    const token = auth.getTokens()
    expect(token).toEqual({ access: { value: 'accessTokenValue' } })

    expect(sessionStorage.getItem('auth.accessToken')).toBe('accessTokenValue')
    expect(localStorage.getItem('auth.accessToken')).toBe('accessTokenValue')

    return null
  })

  it('init sessionStorage only', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    sessionStorage.setItem('auth.accessToken', 'accessTokenValue')

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter)
    await auth.loadTokensFromStorage()

    const token = auth.getTokens()
    expect(token).toEqual({ access: { value: 'accessTokenValue' } })

    expect(sessionStorage.getItem('auth.accessToken')).toBe('accessTokenValue')
    expect(localStorage.getItem('auth.accessToken')).toBeNull()

    return null
  })

  it('init when sessionStorage and localStorage are empty', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter)
    await auth.loadTokensFromStorage()

    const token = auth.getTokens()
    expect(token).toBeUndefined()

    expect(sessionStorage.getItem('auth.accessToken')).toBeNull()
    expect(localStorage.getItem('auth.accessToken')).toBeNull()

    return null
  })

  it('accessToken and refreshToken are defined', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    sessionStorage.setItem('auth.accessToken', 'accessTokenValue')
    sessionStorage.setItem('auth.refreshToken', 'refreshTokenValue')

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter)
    await auth.loadTokensFromStorage()

    expect(auth.accessToken).toEqual('accessTokenValue')
    expect(auth.refreshToken).toEqual('refreshTokenValue')

    return null
  })

  it('isAuthenticated', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    sessionStorage.setItem('auth.accessToken', 'accessTokenValue')
    sessionStorage.setItem('auth.refreshToken', 'refreshTokenValue')

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter)
    await auth.loadTokensFromStorage()

    expect(auth.isAuthenticated()).toBeTruthy()

    await auth.logout()

    expect(auth.isAuthenticated()).toBeFalsy()

    return null
  })

  it('isSaveCredentials returns true if initialized with values in localStorage', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    localStorage.setItem('auth.accessToken', 'accessTokenValue')
    localStorage.setItem('auth.refreshToken', 'refreshTokenValue')

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter)
    await auth.loadTokensFromStorage()

    expect(auth.isSaveCredentials()).toBeTruthy()

    return null
  })

  it('isSaveCredentials returns false if not initialized with values in localStorage', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    sessionStorage.setItem('auth.accessToken', 'accessTokenValue')
    sessionStorage.setItem('auth.refreshToken', 'refreshTokenValue')

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter)
    await auth.loadTokensFromStorage()

    expect(auth.isSaveCredentials()).toBeFalsy()

    return null
  })

  it('login', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onPost('login').reply(200, {
      access_token: 'accessTokenValue',
      refresh_token: 'refreshTokenValue'
    } as LoginResponse)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter)

    const listener: AuthListener = {
      login: jest.fn(),
      renew: jest.fn(),
      logout: jest.fn(),
      expired: jest.fn(),
      tokensChanged: jest.fn()
    }
    auth.addListener(listener)

    await auth.login({ username: 'testUsername', password: 'testPassword' })
    expect(auth.isAuthenticated())

    expect(listener.login).toHaveBeenCalledTimes(1)
    expect(listener.login).toHaveBeenLastCalledWith()
    expect(listener.tokensChanged).toHaveBeenCalledTimes(1)
    expect(listener.tokensChanged).toHaveBeenLastCalledWith({
      access: { value: 'accessTokenValue' },
      refresh: { value: 'refreshTokenValue' }
    })
    auth.removeListener(listener)

    const response2 = await auth.login({ username: 'testUsername', password: 'testPassword' })
    expect(listener.login).toHaveBeenCalledTimes(1)
    expect(listener.login).toHaveBeenLastCalledWith()
    expect(listener.tokensChanged).toHaveBeenCalledTimes(1)
    expect(listener.tokensChanged).toHaveBeenLastCalledWith({
      access: { value: 'accessTokenValue' },
      refresh: { value: 'refreshTokenValue' }
    })
    expect(listener.renew).not.toHaveBeenCalled()
    expect(listener.logout).not.toHaveBeenCalled()
    expect(listener.expired).not.toHaveBeenCalled()

    return null
  })

  it('login with saveCredentials true', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onPost('login').reply(200, {
      access_token: 'accessTokenValue',
      refresh_token: 'refreshTokenValue'
    } as LoginResponse)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter)

    const listener: AuthListener = {
      login: jest.fn(),
      renew: jest.fn(),
      logout: jest.fn(),
      expired: jest.fn(),
      tokensChanged: jest.fn()
    }
    auth.addListener(listener)
    expect(auth.isSaveCredentials()).toBeFalsy()

    await auth.login({ username: 'testUsername', password: 'testPassword' }, true)
    expect(auth.isSaveCredentials()).toBeTruthy()

    await auth.login({ username: 'testUsername', password: 'testPassword' }, false)
    expect(auth.isSaveCredentials()).toBeFalsy()

    return null
  })

  it('logout without logoutEndpoint defined', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onPost('login').reply(200, {
      access_token: 'accessTokenValue',
      refresh_token: 'refreshTokenValue'
    } as LoginResponse)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    localStorage.setItem('auth.accessToken', 'accessTokenValue')
    localStorage.setItem('auth.refreshToken', 'refreshTokenValue')

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter)
    await auth.loadTokensFromStorage()
    expect(auth.isAuthenticated()).toBeTruthy()

    const listener: AuthListener = {
      login: jest.fn(),
      renew: jest.fn(),
      logout: jest.fn(),
      expired: jest.fn(),
      tokensChanged: jest.fn()
    }
    auth.addListener(listener)

    await auth.logout()
    expect(auth.isAuthenticated()).toBeFalsy()

    expect(listener.login).not.toHaveBeenCalled()
    expect(listener.tokensChanged).toHaveBeenCalledTimes(1)
    expect(listener.tokensChanged).toHaveBeenLastCalledWith()
    expect(listener.renew).not.toHaveBeenCalled()
    expect(listener.logout).toHaveBeenCalledTimes(1)
    expect(listener.login).not.toHaveBeenLastCalledWith()
    auth.removeListener(listener)

    await auth.login({ username: 'testUsername', password: 'testPassword' }, true)

    await auth.logout()
    expect(listener.login).not.toHaveBeenCalled()
    expect(listener.tokensChanged).toHaveBeenCalledTimes(1)
    expect(listener.tokensChanged).toHaveBeenLastCalledWith()
    expect(listener.renew).not.toHaveBeenCalled()
    expect(listener.logout).toHaveBeenCalledTimes(1)
    expect(listener.login).not.toHaveBeenLastCalledWith()

    return null
  })

  it('logout with logoutEndpoint defined', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onPost('login').reply(200, {
      access_token: 'accessTokenValue',
      refresh_token: 'refreshTokenValue'
    } as LoginResponse)
    axiosMock.onPost('logout').reply(200)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' },
      logoutEndpoint: { method: 'post', url: 'logout' }
    }

    localStorage.setItem('auth.accessToken', 'accessTokenValue')
    localStorage.setItem('auth.refreshToken', 'refreshTokenValue')

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter)
    await auth.loadTokensFromStorage()
    expect(auth.isAuthenticated()).toBeTruthy()

    const listener: AuthListener = {
      login: jest.fn(),
      renew: jest.fn(),
      logout: jest.fn(),
      expired: jest.fn(),
      tokensChanged: jest.fn()
    }
    auth.addListener(listener)

    await auth.logout()
    expect(auth.isAuthenticated()).toBeFalsy()

    expect(listener.login).not.toHaveBeenCalled()
    expect(listener.tokensChanged).toHaveBeenCalledTimes(1)
    expect(listener.tokensChanged).toHaveBeenLastCalledWith()
    expect(listener.renew).not.toHaveBeenCalled()
    expect(listener.logout).toHaveBeenCalledTimes(1)
    expect(listener.login).not.toHaveBeenLastCalledWith()
    auth.removeListener(listener)

    await auth.login({ username: 'testUsername', password: 'testPassword' }, true)

    await auth.logout()
    expect(listener.login).not.toHaveBeenCalled()
    expect(listener.tokensChanged).toHaveBeenCalledTimes(1)
    expect(listener.tokensChanged).toHaveBeenLastCalledWith()
    expect(listener.renew).not.toHaveBeenCalled()
    expect(listener.logout).toHaveBeenCalledTimes(1)
    expect(listener.login).not.toHaveBeenLastCalledWith()

    return null
  })

  it('renew with renewEndpoint defined', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onPost('login').reply(200, {
      access_token: 'accessTokenValue',
      refresh_token: 'refreshTokenValue'
    } as LoginResponse)
    axiosMock.onPost('renew').reply(200, {
      access_token: 'accessTokenValueRenew',
      refresh_token: 'refreshTokenValueRenew'
    } as LoginResponse)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' },
      renewEndpoint: { method: 'post', url: 'renew' }
    }

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter)

    const listener: AuthListener = {
      login: jest.fn(),
      renew: jest.fn(),
      logout: jest.fn(),
      expired: jest.fn(),
      tokensChanged: jest.fn()
    }
    auth.addListener(listener)

    await auth.login({ username: 'testUsername', password: 'testPassword' })
    expect(auth.isAuthenticated())

    expect(listener.login).toHaveBeenCalledTimes(1)
    expect(listener.login).toHaveBeenLastCalledWith()
    expect(listener.tokensChanged).toHaveBeenCalledTimes(1)
    expect(listener.tokensChanged).toHaveBeenLastCalledWith({
      access: { value: 'accessTokenValue' },
      refresh: { value: 'refreshTokenValue' }
    })

    await auth.renew()
    expect(listener.login).toHaveBeenCalledTimes(1)
    expect(listener.login).toHaveBeenLastCalledWith()
    expect(listener.tokensChanged).toHaveBeenCalledTimes(2)
    expect(listener.tokensChanged).toHaveBeenLastCalledWith({
      access: { value: 'accessTokenValueRenew' },
      refresh: { value: 'refreshTokenValueRenew' }
    })
    expect(listener.renew).toHaveBeenCalledTimes(1)
    expect(listener.logout).not.toHaveBeenCalled()
    expect(listener.expired).not.toHaveBeenCalled()

    return null
  })


})
