import Auth, { AuthListener, ServerConfiguration, Token, TokenDecoder } from '../src/auth-toolbox'
import AxiosAdapter from '../src/client-adapter/axios-adapter'
import axios from 'axios'
import OpenidConnectAdapter, { LoginResponse } from '../src/server-adapter/openid-connect-adapter'
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

  it('defines a default module', () => {
    expect(Auth).toBeDefined()
  })

  it('loads token from sessionStorage', async () => {
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

  it('loads tokens from localStorage', async () => {
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

  it('loads tokens from storage with undefined TokenStorage', async () => {
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

  it('loads tokens from storage with defined SessionStorageAdapter', async () => {
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

  it('updates localStorage from sessionStorage when loading tokens from storage and ', async () => {
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

  it('loads tokens from storage when localStorage is empty', async () => {
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

  it('loads tokens from storage when sessionStorage and localStorage are empty', async () => {
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

  it('accessToken and refreshToken are defined after loading tokens from storage', async () => {
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

  it('is authenticated after loading tokens from storage', async () => {
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

  it('isSaveCredentials is true when localStorage contains token values and loading tokens from storage', async () => {
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

  it('isSaveCredentials is false when localStorage is empty and loading token from storage', async () => {
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

  it('logs in', async () => {
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

  it('logs in with save credentials', async () => {
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

  it('logs out with undefined logoutEndpoint', async () => {
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

  it('logs out with defined logoutEndpoint', async () => {
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

  it('renews with defined renewEndpoint', async () => {
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

  it('renews only once when multiple requests are performed', async () => {
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

    await Promise.all([auth.renew(), auth.renew(), auth.renew()])
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

  it('fails to renew only once when multiple requests are performed', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onPost('login').reply(200, {
      access_token: 'accessTokenValue',
      refresh_token: 'refreshTokenValue'
    } as LoginResponse)
    axiosMock.onPost('renew').reply(400, {
      error: 'invalid_grant'
    })

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

    try {
      await Promise.all([auth.renew(), auth.renew(), auth.renew()])
    } catch (e) {
      expect(() => {
        throw e
      }).toThrow()
    }

    expect(listener.login).toHaveBeenCalledTimes(1)
    expect(listener.login).toHaveBeenLastCalledWith()
    expect(listener.tokensChanged).toHaveBeenCalledTimes(2)
    expect(listener.tokensChanged).toHaveBeenLastCalledWith()
    expect(listener.logout).not.toHaveBeenCalled()
    expect(listener.expired).toHaveBeenCalledTimes(1)

    return null
  })

  it('intercepts with undefined token decoder and expired access token', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onGet('custom').reply((config) => {
      if (config.headers.Authorization === 'Bearer accessTokenValueRenew') {
        return [200]
      } else {
        return [401, {
          error: 'invalid_token'
        }]
      }
    })

    axiosMock.onPost('login').reply((config) => {
      if (config.data === 'grant_type=password&username=testUsername&password=testPassword') {
        return [200, {
          access_token: 'accessTokenValue',
          refresh_token: 'refreshTokenValue'
        } as LoginResponse]
      } else {
        return [401]
      }
    })

    axiosMock.onPost('renew').reply(200, {
      access_token: 'accessTokenValueRenew',
      refresh_token: 'refreshTokenValueRenew'
    })

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'POST', url: 'login' },
      renewEndpoint: { method: 'POST', url: 'renew' }
    }

    const tokenDecoder: TokenDecoder = {
      isExpired (token: Token) {
        return token.value === 'accessTokenValue'
      }
    }
    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, tokenDecoder)

    await auth.login({ username: 'testUsername', password: 'testPassword' })

    await axiosInstance.get('custom')

    return null
  })

  it('intercepts with expired renew token', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onGet('custom').reply((config) => {
      if (config.headers.Authorization === 'Bearer accessTokenValueRenew') {
        return [200]
      } else {
        return [401, {
          error: 'invalid_token'
        }]
      }
    })

    axiosMock.onPost('login').reply((config) => {
      if (config.data === 'grant_type=password&username=testUsername&password=testPassword') {
        return [200, {
          access_token: 'accessTokenValue',
          refresh_token: 'refreshTokenValue'
        } as LoginResponse]
      } else {
        return [401]
      }
    })

    axiosMock.onPost('renew').reply(400, {
      error: 'invalid_grant'
    })

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'POST', url: 'login' },
      renewEndpoint: { method: 'POST', url: 'renew' }
    }

    const tokenDecoder: TokenDecoder = {
      isExpired (token: Token) {
        return token.value === 'accessTokenValue'
      }
    }
    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, tokenDecoder)

    await auth.login({ username: 'testUsername', password: 'testPassword' })

    try {
      await axiosInstance.get('custom')
    } catch (e) {
      expect(() => {
        throw e
      }).toThrow()
    }

    return null
  })

  it('intercepts with null token decoder and expired access token', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onGet('custom').reply((config) => {
      if (config.headers.Authorization === 'Bearer accessTokenValueRenew') {
        return [200]
      } else {
        return [401, {
          error: 'invalid_token'
        }]
      }
    })

    axiosMock.onPost('login').reply((config) => {
      if (config.data === 'grant_type=password&username=testUsername&password=testPassword') {
        return [200, {
          access_token: 'accessTokenValue',
          refresh_token: 'refreshTokenValue'
        } as LoginResponse]
      } else {
        return [401]
      }
    })

    axiosMock.onPost('renew').reply(200, {
      access_token: 'accessTokenValueRenew',
      refresh_token: 'refreshTokenValueRenew'
    })

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'POST', url: 'login' },
      renewEndpoint: { method: 'POST', url: 'renew' }
    }

    const tokenDecoder = null
    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, tokenDecoder)

    await auth.login({ username: 'testUsername', password: 'testPassword' })

    await axiosInstance.get('custom')

    return null
  })

  it('intercepts with null token decoder and expired access token and expired refresh token', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onGet('custom').reply((config) => {
      if (config.headers.Authorization === 'Bearer accessTokenValueRenew') {
        return [200]
      } else {
        return [401, {
          error: 'invalid_token'
        }]
      }
    })

    axiosMock.onPost('login').reply((config) => {
      if (config.data === 'grant_type=password&username=testUsername&password=testPassword') {
        return [200, {
          access_token: 'accessTokenValue',
          refresh_token: 'refreshTokenValue'
        } as LoginResponse]
      } else {
        return [401]
      }
    })

    axiosMock.onPost('renew').reply(401, {
      error: 'invalid_grant'
    })

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'POST', url: 'login' },
      renewEndpoint: { method: 'POST', url: 'renew' }
    }

    const tokenDecoder = null
    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, tokenDecoder)

    await auth.login({ username: 'testUsername', password: 'testPassword' })


    try {
      await axiosInstance.get('custom')
    } catch (e) {
      expect(() => {
        throw e
      }).toThrow()
    }

    return null
  })

  it('does not intercept after release', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onGet('custom').reply((config) => {
      if (config.headers.Authorization === 'Bearer accessTokenValueRenew') {
        return [200]
      } else {
        return [401, {
          error: 'invalid_token'
        }]
      }
    })

    axiosMock.onPost('login').reply((config) => {
      if (config.data === 'grant_type=password&username=testUsername&password=testPassword') {
        return [200, {
          access_token: 'accessTokenValue',
          refresh_token: 'refreshTokenValue'
        } as LoginResponse]
      } else {
        return [401]
      }
    })

    axiosMock.onPost('renew').reply(200, {
      access_token: 'accessTokenValueRenew',
      refresh_token: 'refreshTokenValueRenew'
    })

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'POST', url: 'login' },
      renewEndpoint: { method: 'POST', url: 'renew' }
    }

    const tokenDecoder = null
    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, tokenDecoder)

    await auth.login({ username: 'testUsername', password: 'testPassword' })
    auth.release()

    try {
      await axiosInstance.get('custom')
    } catch (e) {
      expect(() => {
        throw e
      }).toThrow()
    }

    return null
  })

  it('logs int, renew and logs out with undefined TokenStorage', async () => {
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

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, null, null, null)

    const listener: AuthListener = {
      login: jest.fn(),
      renew: jest.fn(),
      logout: jest.fn(),
      expired: jest.fn(),
      tokensChanged: jest.fn()
    }
    auth.addListener(listener)

    await auth.login({ username: 'testUsername', password: 'testPassword' })
    await auth.renew()
    await auth.logout()

    return null
  })

  it('logs out with undefined tokens', async () => {
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

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, null, null, null)

    const listener: AuthListener = {
      login: jest.fn(),
      renew: jest.fn(),
      logout: jest.fn(),
      expired: jest.fn(),
      tokensChanged: jest.fn()
    }
    auth.addListener(listener)

    await auth.logout()

    return null
  })

  it('renews with undefined tokens', async () => {
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

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, null, null, null)

    const listener: AuthListener = {
      login: jest.fn(),
      renew: jest.fn(),
      logout: jest.fn(),
      expired: jest.fn(),
      tokensChanged: jest.fn()
    }
    auth.addListener(listener)

    await auth.renew()

    return null
  })
})
