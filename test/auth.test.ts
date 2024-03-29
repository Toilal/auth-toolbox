import {
  Auth,
  AuthListener,
  AxiosAdapter,
  DefaultTokenStorage,
  JwtTokenDecoder,
  OpenidConnectAdapter,
  Request,
  Response,
  ServerConfiguration,
  Token,
  TokenDecoder,
  Tokens,
  TokenStorage,
  TokenStorageAsyncAdapter
} from '../src'
import axios from 'axios'
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

  it('loads token from sessionStorage', () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    sessionStorage.setItem('auth.accessToken', 'accessTokenValue')

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter)

    const token = auth.getTokens()
    expect(token).toBeDefined()
    if (token != null) {
      expect(token.access.value).toBe('accessTokenValue')
      expect(token.refresh).toBeUndefined()
    }

    expect(localStorage.getItem('auth.accessToken')).toBe(null)
  })

  it('does not load token from sessionStorage when loadTokensFromStorage is false', () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    sessionStorage.setItem('auth.accessToken', 'accessTokenValue')

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, {
      loadTokensFromStorage: false
    })

    const token = auth.getTokens()
    expect(token).toBeUndefined()
  })

  it('loads tokens from localStorage', () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    localStorage.setItem('auth.accessToken', 'accessTokenValue')

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter)
    auth.loadTokensFromStorage()

    const token = auth.getTokens()
    expect(token).toBeDefined()
    if (token != null) {
      expect(token.access.value).toBe('accessTokenValue')
      expect(token.refresh).toBeUndefined()
    }

    expect(sessionStorage.getItem('auth.accessToken')).toBe('accessTokenValue')
  })

  it('loads tokens from sync localStorage (async)', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    localStorage.setItem('auth.accessToken', 'accessTokenValue')

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter)
    await auth.loadTokensFromStorageAsync()

    const token = auth.getTokens()
    expect(token).toBeDefined()
    if (token != null) {
      expect(token.access.value).toBe('accessTokenValue')
      expect(token.refresh).toBeUndefined()
    }

    expect(sessionStorage.getItem('auth.accessToken')).toBe('accessTokenValue')
  })

  it('loads tokens from async localStorage (async)', done => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    const tokenStorage = new TokenStorageAsyncAdapter(new DefaultTokenStorage(sessionStorage), false)
    const persistentTokenStorage = new TokenStorageAsyncAdapter(new DefaultTokenStorage(localStorage), false)

    localStorage.setItem('auth.accessToken', 'accessTokenValue')

    const listener: AuthListener = {
      initialized (loaded, error) {
        expect(loaded).toBeTruthy()
        expect(error).toBeUndefined()

        const token = auth.getTokens()
        expect(token).toBeDefined()
        if (token != null) {
          expect(token.access.value).toBe('accessTokenValue')
          expect(token.refresh).toBeUndefined()
        }

        expect(sessionStorage.getItem('auth.accessToken')).toBe('accessTokenValue')
        done()
      }
    }

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, {
      tokenStorage,
      persistentTokenStorage,
      loadTokensFromStorage: true,
      listeners: [listener]
    })
  })

  it('loads tokens from async localStorage (async)', done => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    class FailingTokenStorage implements TokenStorage {
      readonly async = false

      clear (): void {
        throw new Error('!FailingTokenStorage!')
      }

      getTokens<C>(): Tokens<C> | undefined {
        throw new Error('!FailingTokenStorage!')
      }

      store<C>(tokens: Tokens<C>): void {
        throw new Error('!FailingTokenStorage!')
      }
    }

    const tokenStorage = new TokenStorageAsyncAdapter(new DefaultTokenStorage(sessionStorage), false)
    const persistentTokenStorage = new TokenStorageAsyncAdapter(new FailingTokenStorage(), false)

    localStorage.setItem('auth.accessToken', 'accessTokenValue')

    const listener: AuthListener = {
      initialized (loaded, error) {
        expect(loaded).toBeFalsy()
        expect(error).toBeInstanceOf(Error)

        done()
      }
    }

    // eslint-disable-next-line no-new
    new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, {
      tokenStorage,
      persistentTokenStorage,
      loadTokensFromStorage: true,
      listeners: [listener]
    })
  })

  it('fails to load tokens from async localStorage (sync)', () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    const tokenStorage = new TokenStorageAsyncAdapter(new DefaultTokenStorage(sessionStorage), false)
    const persistentTokenStorage = new TokenStorageAsyncAdapter(new DefaultTokenStorage(localStorage), false)

    localStorage.setItem('auth.accessToken', 'accessTokenValue')

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, {
      tokenStorage,
      persistentTokenStorage
    })

    expect(() => auth.loadTokensFromStorage()).toThrow(
      'tokenStorage is async. Use loadTokensFromStorageAsync method instead'
    )
  })

  it('loads tokens from storage with undefined TokenStorage', () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    localStorage.setItem('auth.accessToken', 'accessTokenValue')

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, {
      accessTokenDecoder: null,
      tokenStorage: null,
      persistentTokenStorage: null
    })
    auth.loadTokensFromStorage()
  })

  it('loads tokens from storage with defined SessionStorageAdapter', () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    localStorage.setItem('auth.accessToken', 'accessTokenValue')

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, {
      persistentTokenStorage: null
    })
    auth.loadTokensFromStorage()

    const token = auth.getTokens()
    expect(token).toBeUndefined()

    expect(sessionStorage.getItem('auth.accessToken')).toBeNull()
  })

  it('updates localStorage from sessionStorage when loading tokens from storage', () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    sessionStorage.setItem('auth.accessToken', 'accessTokenValue')
    localStorage.setItem('auth.accessToken', 'accessTokenValueDummy')

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter)
    auth.loadTokensFromStorage()

    const token = auth.getTokens()
    expect(token).toEqual({ access: { value: 'accessTokenValue' } })

    expect(sessionStorage.getItem('auth.accessToken')).toBe('accessTokenValue')
    expect(localStorage.getItem('auth.accessToken')).toBe('accessTokenValue')
  })

  it('loads tokens from storage when localStorage is empty', () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    sessionStorage.setItem('auth.accessToken', 'accessTokenValue')

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter)
    auth.loadTokensFromStorage()

    const token = auth.getTokens()
    expect(token).toEqual({ access: { value: 'accessTokenValue' } })

    expect(sessionStorage.getItem('auth.accessToken')).toBe('accessTokenValue')
    expect(localStorage.getItem('auth.accessToken')).toBeNull()
  })

  it('loads tokens from storage when sessionStorage and localStorage are empty', () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter)
    auth.loadTokensFromStorage()

    const token = auth.getTokens()
    expect(token).toBeUndefined()

    expect(sessionStorage.getItem('auth.accessToken')).toBeNull()
    expect(localStorage.getItem('auth.accessToken')).toBeNull()
  })

  it('accessToken and refreshToken are defined after loading tokens from storage', () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    sessionStorage.setItem('auth.accessToken', 'accessTokenValue')
    sessionStorage.setItem('auth.refreshToken', 'refreshTokenValue')

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter)
    auth.loadTokensFromStorage()

    const tokens = auth.getTokens()

    expect(tokens).toBeDefined()
    if (tokens != null) {
      expect(tokens.access.value).toEqual('accessTokenValue')
      expect(tokens.refresh).toBeDefined()
      if (tokens.refresh != null) {
        expect(tokens.refresh.value).toEqual('refreshTokenValue')
      }
    }
  })

  it('decodes accessToken with defined tokenDecoder.decode', () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const accessToken =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJKd3QgVG9vbGJveCIsImlhdCI6MTMzNzEzMzExLCJleHAiOjEzMzcxMzM3MSwiYXVkIjoiand0LXRvb2xib3giLCJzdWIiOiJqd3QtdG9vbGJveCJ9.uXiL5Yu-Ip0iNkvmK54U5MHDEhE0M6KsNFAb-BWg6oQ'

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    sessionStorage.setItem('auth.accessToken', accessToken)

    const accessTokenDecoder = new JwtTokenDecoder()

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, {
      accessTokenDecoder
    })
    auth.loadTokensFromStorage()

    const decodedToken = auth.decodeAccessToken()
    expect(decodedToken).toEqual({
      iss: 'Jwt Toolbox',
      iat: 133_713_311,
      exp: 133_713_371,
      aud: 'jwt-toolbox',
      sub: 'jwt-toolbox'
    })
  })

  it('check accessToken is expired defined tokenDecoder.isExpired', () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const accessToken =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJKd3QgVG9vbGJveCIsImlhdCI6MTMzNzEzMzExLCJleHAiOjEzMzcxMzM3MSwiYXVkIjoiand0LXRvb2xib3giLCJzdWIiOiJqd3QtdG9vbGJveCJ9.uXiL5Yu-Ip0iNkvmK54U5MHDEhE0M6KsNFAb-BWg6oQ'

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    sessionStorage.setItem('auth.accessToken', accessToken)

    const accessTokenDecoder = new JwtTokenDecoder()

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, {
      accessTokenDecoder
    })
    auth.loadTokensFromStorage()

    const expiredToken = auth.isExpiredAccessToken()
    expect(expiredToken).toBe(true)
  })

  it('does not decode accessToken with undefined tokenDecoder.decode', () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const accessToken =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJKd3QgVG9vbGJveCIsImlhdCI6MTMzNzEzMzExLCJleHAiOjEzMzcxMzM3MSwiYXVkIjoiand0LXRvb2xib3giLCJzdWIiOiJqd3QtdG9vbGJveCJ9.uXiL5Yu-Ip0iNkvmK54U5MHDEhE0M6KsNFAb-BWg6oQ'

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    sessionStorage.setItem('auth.accessToken', accessToken)

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter)
    auth.loadTokensFromStorage()

    expect(() => {
      auth.decodeAccessToken()
    }).toThrow('An accessTokenDecoder supporting decode method should be defined to decode access token.')
  })

  it('does not decode accessToken with null tokenDecoder', () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const accessToken =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJKd3QgVG9vbGJveCIsImlhdCI6MTMzNzEzMzExLCJleHAiOjEzMzcxMzM3MSwiYXVkIjoiand0LXRvb2xib3giLCJzdWIiOiJqd3QtdG9vbGJveCJ9.uXiL5Yu-Ip0iNkvmK54U5MHDEhE0M6KsNFAb-BWg6oQ'

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    sessionStorage.setItem('auth.accessToken', accessToken)

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, {
      accessTokenDecoder: null
    })
    auth.loadTokensFromStorage()

    try {
      auth.decodeAccessToken()
      expect(false).toBeTruthy()
    } catch (error) {
      expect(() => {
        throw error
      }).toThrow('')
    }
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
    auth.loadTokensFromStorage()

    expect(auth.isAuthenticated()).toBeTruthy()

    await auth.logout()

    expect(auth.isAuthenticated()).toBeFalsy()
  })

  it('isSaveCredentials is true when localStorage contains token values and loading tokens from storage', () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    localStorage.setItem('auth.accessToken', 'accessTokenValue')
    localStorage.setItem('auth.refreshToken', 'refreshTokenValue')

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter)
    auth.loadTokensFromStorage()

    expect(auth.usePersistentStorage).toBeTruthy()
  })

  it('isSaveCredentials is false when localStorage is empty and loading token from storage', () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    sessionStorage.setItem('auth.accessToken', 'accessTokenValue')
    sessionStorage.setItem('auth.refreshToken', 'refreshTokenValue')

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter)
    auth.loadTokensFromStorage()

    expect(auth.usePersistentStorage).toBeFalsy()
  })

  it('logs in', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onPost('login').reply(200, {
      access_token: 'accessTokenValue',
      refresh_token: 'refreshTokenValue'
    })

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    const listener: AuthListener = {
      initialized: jest.fn(),
      login: jest.fn(),
      renew: jest.fn(),
      logout: jest.fn(),
      expired: jest.fn(),
      tokensChanged: jest.fn()
    }

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, {
      listeners: [listener]
    })

    await auth.login({ username: 'testUsername', password: 'testPassword' })
    expect(auth.isAuthenticated())

    expect(listener.login).toHaveBeenCalledTimes(1)
    expect(listener.login).toHaveBeenLastCalledWith()
    expect(listener.tokensChanged).toHaveBeenCalledTimes(2)
    expect(listener.tokensChanged).toHaveBeenNthCalledWith(1)
    expect(listener.tokensChanged).toHaveBeenNthCalledWith(2, {
      access: { value: 'accessTokenValue' },
      refresh: { value: 'refreshTokenValue' }
    })
    auth.removeListener(listener)

    await auth.login({ username: 'testUsername', password: 'testPassword' })
    expect(listener.login).toHaveBeenCalledTimes(1)
    expect(listener.login).toHaveBeenLastCalledWith()
    expect(listener.tokensChanged).toHaveBeenCalledTimes(2)
    expect(listener.tokensChanged).toHaveBeenNthCalledWith(1)
    expect(listener.tokensChanged).toHaveBeenNthCalledWith(2, {
      access: { value: 'accessTokenValue' },
      refresh: { value: 'refreshTokenValue' }
    })
    expect(listener.renew).not.toHaveBeenCalled()
    expect(listener.logout).not.toHaveBeenCalled()
    expect(listener.expired).not.toHaveBeenCalled()
  })

  it('logs in with save credentials defined and renewEndpoint defined', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onPost('login').reply(200, {
      access_token: 'accessTokenValue',
      refresh_token: 'refreshTokenValue'
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
    expect(auth.usePersistentStorage).toBeFalsy()

    auth.usePersistentStorage = true
    await auth.login({ username: 'testUsername', password: 'testPassword' })
    expect(auth.usePersistentStorage).toBeTruthy()
    let tokens = auth.getTokens()
    expect(tokens).toBeDefined()
    if (tokens != null) {
      expect(tokens.credentials).toBeUndefined()
    }
    expect(localStorage.getItem('auth.credentials')).toBeNull()

    auth.usePersistentStorage = false
    await auth.login({ username: 'testUsername', password: 'testPassword' })
    expect(auth.usePersistentStorage).toBeFalsy()

    tokens = auth.getTokens()
    expect(tokens).toBeDefined()
    if (tokens != null) {
      expect(tokens.credentials).toBeUndefined()
    }
    expect(localStorage.getItem('auth.credentials')).toBeNull()
  })

  it('logs in with save credentials defined and renewEndpoint undefined', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onPost('login').reply(200, {
      access_token: 'accessTokenValue',
      refresh_token: 'refreshTokenValue'
    })

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

    auth.usePersistentStorage = true
    await auth.login({ username: 'testUsername', password: 'testPassword' })
    let tokens = auth.getTokens()
    expect(tokens).toBeDefined()
    if (tokens != null) {
      expect(tokens.credentials).toBeDefined()
    }
    expect(localStorage.getItem('auth.credentials')).not.toBeNull()
    expect(JSON.parse(localStorage.getItem('auth.credentials')!)).toEqual({
      username: 'testUsername',
      password: 'testPassword'
    })

    auth.usePersistentStorage = false
    await auth.login({ username: 'testUsername', password: 'testPassword' })

    tokens = auth.getTokens()
    expect(tokens).toBeDefined()
    if (tokens != null) {
      expect(tokens.credentials).toBeUndefined()
    }
    expect(localStorage.getItem('auth.credentials')).toBeNull()
  })

  it('logs out with undefined logoutEndpoint', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onPost('login').reply(200, {
      access_token: 'accessTokenValue',
      refresh_token: 'refreshTokenValue'
    })

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    localStorage.setItem('auth.accessToken', 'accessTokenValue')
    localStorage.setItem('auth.refreshToken', 'refreshTokenValue')

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter)
    auth.loadTokensFromStorage()
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

    auth.usePersistentStorage = true
    await auth.login({ username: 'testUsername', password: 'testPassword' })

    await auth.logout()
    expect(listener.login).not.toHaveBeenCalled()
    expect(listener.tokensChanged).toHaveBeenCalledTimes(1)
    expect(listener.tokensChanged).toHaveBeenLastCalledWith()
    expect(listener.renew).not.toHaveBeenCalled()
    expect(listener.logout).toHaveBeenCalledTimes(1)
    expect(listener.login).not.toHaveBeenLastCalledWith()
  })

  it('logs out with defined logoutEndpoint', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onPost('login').reply(200, {
      access_token: 'accessTokenValue',
      refresh_token: 'refreshTokenValue'
    })
    axiosMock.onPost('logout').reply(200)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' },
      logoutEndpoint: { method: 'post', url: 'logout' }
    }

    localStorage.setItem('auth.accessToken', 'accessTokenValue')
    localStorage.setItem('auth.refreshToken', 'refreshTokenValue')

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter)
    auth.loadTokensFromStorage()
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

    auth.usePersistentStorage = true
    await auth.login({ username: 'testUsername', password: 'testPassword' })

    await auth.logout()
    expect(listener.login).not.toHaveBeenCalled()
    expect(listener.tokensChanged).toHaveBeenCalledTimes(1)
    expect(listener.tokensChanged).toHaveBeenLastCalledWith()
    expect(listener.renew).not.toHaveBeenCalled()
    expect(listener.logout).toHaveBeenCalledTimes(1)
    expect(listener.login).not.toHaveBeenLastCalledWith()
  })

  it('renews with defined renewEndpoint', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onPost('login').reply(200, {
      access_token: 'accessTokenValue',
      refresh_token: 'refreshTokenValue'
    })
    axiosMock.onPost('renew').reply(200, {
      access_token: 'accessTokenValueRenew',
      refresh_token: 'refreshTokenValueRenew'
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
  })

  it('fails to renew with defined renewEndpoint and missing refresh_token in response', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onPost('login').reply(200, {
      access_token: 'accessTokenValue'
    })

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' },
      renewEndpoint: { method: 'post', url: 'renew' }
    }

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter)

    await auth.login({ username: 'testUsername', password: 'testPassword' })
    expect(auth.isAuthenticated())

    try {
      await auth.renew()
      expect(false).toBeTruthy()
    } catch (error) {
      expect(() => {
        throw error
      }).toThrow('Can\'t renew with the current state.')
    }
  })

  it('renews only once when multiple requests are performed', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onPost('login').reply(200, {
      access_token: 'accessTokenValue',
      refresh_token: 'refreshTokenValue'
    })
    axiosMock.onPost('renew').reply(200, {
      access_token: 'accessTokenValueRenew',
      refresh_token: 'refreshTokenValueRenew'
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
  })

  it('fails to renew only once when multiple requests are performed', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onPost('login').reply(200, {
      access_token: 'accessTokenValue',
      refresh_token: 'refreshTokenValue'
    })
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
      expect(false).toBeTruthy()
    } catch (error) {
      expect(() => {
        throw error
      }).toThrow('')
    }

    expect(listener.login).toHaveBeenCalledTimes(1)
    expect(listener.login).toHaveBeenLastCalledWith()
    expect(listener.tokensChanged).toHaveBeenCalledTimes(2)
    expect(listener.tokensChanged).toHaveBeenLastCalledWith()
    expect(listener.logout).not.toHaveBeenCalled()
    expect(listener.expired).toHaveBeenCalledTimes(1)
  })

  it('intercepts with undefined token decoder and expired access token', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onGet('custom').reply(config => {
      if (config.headers?.Authorization === 'Bearer accessTokenValueRenew') {
        return [200]
      } else {
        return [
          401,
          {
            error: 'invalid_token'
          }
        ]
      }
    })

    axiosMock.onPost('login').reply(config => {
      if (config.data === 'grant_type=password&username=testUsername&password=testPassword') {
        return [
          200,
          {
            access_token: 'accessTokenValue',
            refresh_token: 'refreshTokenValue'
          }
        ]
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

    const accessTokenDecoder: TokenDecoder = {
      isExpired (token: Token) {
        return token.value === 'accessTokenValue'
      }
    }
    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, {
      accessTokenDecoder
    })

    await auth.login({ username: 'testUsername', password: 'testPassword' })

    try {
      await axiosInstance.get('custom')
    } catch (error) {
      expect(() => {
        throw error
      }).not.toThrow()
    }
  })

  it('intercepts with expired renew token', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onGet('custom').reply(config => {
      if (config.headers?.Authorization === 'Bearer accessTokenValueRenew') {
        return [200]
      } else {
        return [
          401,
          {
            error: 'invalid_token'
          }
        ]
      }
    })

    axiosMock.onPost('login').reply(config => {
      if (config.data === 'grant_type=password&username=testUsername&password=testPassword') {
        return [
          200,
          {
            access_token: 'accessTokenValue',
            refresh_token: 'refreshTokenValue'
          }
        ]
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

    const accessTokenDecoder: TokenDecoder = {
      isExpired (token: Token) {
        return token.value === 'accessTokenValue'
      }
    }
    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, {
      accessTokenDecoder
    })

    await auth.login({ username: 'testUsername', password: 'testPassword' })

    try {
      await axiosInstance.get('custom')
      expect(false).toBeTruthy()
    } catch (error) {
      expect(() => {
        throw error
      }).toThrow(/Request failed with status code 400.*/)
    }
  })

  it('intercepts with null token decoder and expired access token', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onGet('custom').reply(config => {
      if (config.headers?.Authorization === 'Bearer accessTokenValueRenew') {
        return [200]
      } else {
        return [
          401,
          {
            error: 'invalid_token'
          }
        ]
      }
    })

    axiosMock.onPost('login').reply(config => {
      if (config.data === 'grant_type=password&username=testUsername&password=testPassword') {
        return [
          200,
          {
            access_token: 'accessTokenValue',
            refresh_token: 'refreshTokenValue'
          }
        ]
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

    const accessTokenDecoder = null
    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, {
      accessTokenDecoder
    })

    await auth.login({ username: 'testUsername', password: 'testPassword' })

    try {
      await axiosInstance.get('custom')
    } catch (error) {
      expect(() => {
        throw error
      }).not.toThrow()
    }
  })

  it('intercepts with null token decoder and expired access token and expired refresh token', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onGet('custom').reply(config => {
      if (config.headers?.Authorization === 'Bearer accessTokenValueRenew') {
        return [200]
      } else {
        return [
          401,
          {
            error: 'invalid_token'
          }
        ]
      }
    })

    axiosMock.onPost('login').reply(config => {
      if (config.data === 'grant_type=password&username=testUsername&password=testPassword') {
        return [
          200,
          {
            access_token: 'accessTokenValue',
            refresh_token: 'refreshTokenValue'
          }
        ]
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
      expect(false).toBeTruthy()
    } catch (error) {
      expect(() => {
        throw error
      }).toThrow(/Request failed with status code 401.*/)
    }
  })

  it('intercepts with null token decoder and expired access token and no refresh token', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onGet('custom').reply(config => {
      if (config.headers?.Authorization === 'Bearer accessTokenValueRenew') {
        return [200]
      } else {
        return [
          401,
          {
            error: 'invalid_token'
          }
        ]
      }
    })

    axiosMock.onPost('login').reply(config => {
      if (config.data === 'grant_type=password&username=testUsername&password=testPassword') {
        return [
          200,
          {
            access_token: 'accessTokenValue'
          }
        ]
      } else {
        return [401]
      }
    })

    axiosMock.onPost('renew').reply(401, {
      error: 'invalid_grant'
    })

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'POST', url: 'login' }
    }

    const tokenDecoder = null
    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, tokenDecoder)

    await auth.login({ username: 'testUsername', password: 'testPassword' })

    try {
      await axiosInstance.get('custom')
      expect(false).toBeTruthy()
    } catch (error) {
      expect(() => {
        throw error
      }).toThrow(/Request failed with status code 401.*/)
    }
  })

  it('intercepts with token decoder and expired access token and no refresh token', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onGet('custom').reply(config => {
      if (config.headers?.Authorization === 'Bearer accessTokenValueRenew') {
        return [200]
      } else {
        return [
          401,
          {
            error: 'invalid_token'
          }
        ]
      }
    })

    axiosMock.onPost('login').reply(config => {
      if (config.data === 'grant_type=password&username=testUsername&password=testPassword') {
        return [
          200,
          {
            access_token: 'accessTokenValue'
          }
        ]
      } else {
        return [401]
      }
    })

    axiosMock.onPost('renew').reply(401, {
      error: 'invalid_grant'
    })

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'POST', url: 'login' }
    }

    class ExpiredTokenDecoder implements TokenDecoder {
      isExpired (token: Token): boolean {
        return true
      }
    }

    const accessTokenDecoder = new ExpiredTokenDecoder()
    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, { accessTokenDecoder })

    await auth.login({ username: 'testUsername', password: 'testPassword' })

    try {
      await axiosInstance.get('custom')
      expect(false).toBeTruthy()
    } catch (error) {
      expect(() => {
        throw error
      }).toThrow('Access token is expired')
    }
  })

  it('does not intercept after release', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onGet('custom').reply(config => {
      if (config.headers?.Authorization === 'Bearer accessTokenValueRenew') {
        return [200]
      } else {
        return [
          401,
          {
            error: 'invalid_token'
          }
        ]
      }
    })

    axiosMock.onPost('login').reply(config => {
      if (config.data === 'grant_type=password&username=testUsername&password=testPassword') {
        return [
          200,
          {
            access_token: 'accessTokenValue',
            refresh_token: 'refreshTokenValue'
          }
        ]
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
      expect(false).toBeTruthy()
    } catch (error) {
      expect(() => {
        throw error
      }).toThrow(/Request failed with status code 401.*/)
    }
  })

  it('does not intercept if clientInterceptors is false', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onGet('custom').reply(config => {
      if (config.headers?.Authorization === 'Bearer accessTokenValueRenew') {
        return [200]
      } else {
        return [
          401,
          {
            error: 'invalid_token'
          }
        ]
      }
    })

    axiosMock.onPost('login').reply(config => {
      if (config.data === 'grant_type=password&username=testUsername&password=testPassword') {
        return [
          200,
          {
            access_token: 'accessTokenValue',
            refresh_token: 'refreshTokenValue'
          }
        ]
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

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, {
      clientInterceptors: false
    })

    await auth.login({ username: 'testUsername', password: 'testPassword' })

    try {
      await axiosInstance.get('custom')
      expect(false).toBeTruthy()
    } catch (error) {
      expect(() => {
        throw error
      }).toThrow(/Request failed with status code 401.*/)
    }
  })

  it('does not intercept if matching a string exclude', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onGet('custom').reply(config => {
      if (config.headers?.Authorization === 'Bearer accessTokenValueRenew') {
        return [200]
      } else {
        return [
          401,
          {
            error: 'invalid_token'
          }
        ]
      }
    })

    axiosMock.onPost('login').reply(config => {
      if (config.data === 'grant_type=password&username=testUsername&password=testPassword') {
        return [
          200,
          {
            access_token: 'accessTokenValue',
            refresh_token: 'refreshTokenValue'
          }
        ]
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

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, {
      excludes: [/.*usto.*/]
    })

    await auth.login({ username: 'testUsername', password: 'testPassword' })

    try {
      await axiosInstance.get('custom')
      expect(false).toBeTruthy()
    } catch (error) {
      expect(() => {
        throw error
      }).toThrow(/Request failed with status code 401.*/)
    }
  })

  it('does not intercept if matching a RegExp exclude', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onGet('custom').reply(config => {
      if (config.headers?.Authorization === 'Bearer accessTokenValueRenew') {
        return [200]
      } else {
        return [
          401,
          {
            error: 'invalid_token'
          }
        ]
      }
    })

    axiosMock.onPost('login').reply(config => {
      if (config.data === 'grant_type=password&username=testUsername&password=testPassword') {
        return [
          200,
          {
            access_token: 'accessTokenValue',
            refresh_token: 'refreshTokenValue'
          }
        ]
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

    const exclude: ((request: Request, response?: Response) => boolean) = (request: Request, response?: Response) =>
      request.url === 'custom'

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, {
      excludes: [exclude]
    })

    await auth.login({ username: 'testUsername', password: 'testPassword' })

    try {
      await axiosInstance.get('custom')
      expect(false).toBeTruthy()
    } catch (error) {
      expect(() => {
        throw error
      }).toThrow(/Request failed with status code 401.*/)
    }
  })

  it('does not intercept if matching a functional exclude', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onGet('custom').reply(config => {
      if (config.headers?.Authorization === 'Bearer accessTokenValueRenew') {
        return [200]
      } else {
        return [
          401,
          {
            error: 'invalid_token'
          }
        ]
      }
    })

    axiosMock.onPost('login').reply(config => {
      if (config.data === 'grant_type=password&username=testUsername&password=testPassword') {
        return [
          200,
          {
            access_token: 'accessTokenValue',
            refresh_token: 'refreshTokenValue'
          }
        ]
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

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, {
      excludes: ['custom']
    })

    await auth.login({ username: 'testUsername', password: 'testPassword' })

    try {
      await axiosInstance.get('custom')
      expect(false).toBeTruthy()
    } catch (error) {
      expect(() => {
        throw error
      }).toThrow(/Request failed with status code 401.*/)
    }
  })

  it('logs in, renew and logs out with undefined TokenStorage and undefined renewEndpoint', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onPost('login').reply(200, {
      access_token: 'accessTokenValue',
      refresh_token: 'refreshTokenValue'
    })
    axiosMock.onPost('logout').reply(200)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' },
      logoutEndpoint: { method: 'post', url: 'logout' }
    }

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, {
      accessTokenDecoder: null,
      tokenStorage: null,
      persistentTokenStorage: null
    })

    await auth.login({ username: 'testUsername', password: 'testPassword' })
    try {
      await auth.renew()
      expect(false).toBeTruthy()
    } catch (error) {
      expect(() => {
        throw error
      }).toThrow(
        'Can\'t renew with the current state.'
      )
    }
    await auth.logout()

    auth.usePersistentStorage = true
    await auth.login({ username: 'testUsername', password: 'testPassword' })
    await auth.renew()
    await auth.logout()
  })

  it('logs in, renew and logs out with undefined TokenStorage and defined renewEndpoint', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onPost('login').reply(200, {
      access_token: 'accessTokenValue',
      refresh_token: 'refreshTokenValue'
    })
    axiosMock.onPost('logout').reply(200)
    axiosMock.onPost('renew').reply(200, {
      access_token: 'accessTokenValueRenew',
      refresh_token: 'refreshTokenValueRenew'
    })

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' },
      renewEndpoint: { method: 'post', url: 'renew' },
      logoutEndpoint: { method: 'post', url: 'logout' }
    }

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, {
      accessTokenDecoder: null,
      tokenStorage: null,
      persistentTokenStorage: null
    })

    await auth.login({ username: 'testUsername', password: 'testPassword' })
    await auth.renew()
    await auth.logout()
  })

  it('logs in, renew and logs out with async server configuration', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onPost('login').reply(200, {
      access_token: 'accessTokenValue',
      refresh_token: 'refreshTokenValue'
    })
    axiosMock.onPost('logout').reply(200)
    axiosMock.onPost('renew').reply(200, {
      access_token: 'accessTokenValueRenew',
      refresh_token: 'refreshTokenValueRenew'
    })

    const openidConnectAdapter = new OpenidConnectAdapter()
    const asyncServerConfiguration: Promise<ServerConfiguration> = new Promise(resolve => {
      const serverConfiguration: ServerConfiguration = {
        loginEndpoint: { method: 'post', url: 'login' },
        renewEndpoint: { method: 'post', url: 'renew' },
        logoutEndpoint: { method: 'post', url: 'logout' }
      }
      setTimeout(() => {
        resolve(serverConfiguration)
      }, 100)
    })

    const auth = new Auth(asyncServerConfiguration, openidConnectAdapter, axiosAdapter)

    await auth.login({ username: 'testUsername', password: 'testPassword' })
    await auth.renew()
    await auth.logout()
  })

  it('calls tokensChanged callback after loading of tokenStorage', () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    /*
    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    */

    const openidConnectAdapter = new OpenidConnectAdapter()
    const asyncServerConfiguration: Promise<ServerConfiguration> = new Promise(resolve => {
      const serverConfiguration: ServerConfiguration = {
        loginEndpoint: { method: 'post', url: 'login' },
        renewEndpoint: { method: 'post', url: 'renew' },
        logoutEndpoint: { method: 'post', url: 'logout' }
      }
      setTimeout(() => {
        resolve(serverConfiguration)
      }, 100)
    })

    sessionStorage.setItem('auth.accessToken', 'accessTokenValue')

    const auth = new Auth(asyncServerConfiguration, openidConnectAdapter, axiosAdapter)
    const listener: AuthListener = {
      tokensChanged: jest.fn()
    }
    auth.addListener(listener)

    auth.loadTokensFromStorage()
    expect(listener.tokensChanged).toHaveBeenCalledTimes(1)
    expect(auth.getTokens()).toEqual({ access: { value: 'accessTokenValue' } })
  })

  it('logs out with undefined tokens', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onPost('login').reply(200, {
      access_token: 'accessTokenValue',
      refresh_token: 'refreshTokenValue'
    })
    axiosMock.onPost('logout').reply(200)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' },
      logoutEndpoint: { method: 'post', url: 'logout' }
    }

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, {
      accessTokenDecoder: null,
      tokenStorage: null,
      persistentTokenStorage: null
    })

    await auth.logout()
  })

  it('renews with undefined tokens', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onPost('login').reply(200, {
      access_token: 'accessTokenValue',
      refresh_token: 'refreshTokenValue'
    })
    axiosMock.onPost('logout').reply(200)

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' },
      logoutEndpoint: { method: 'post', url: 'logout' }
    }

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, {
      accessTokenDecoder: null,
      tokenStorage: null,
      persistentTokenStorage: null
    })

    await auth.renew()
  })

  it('sends Bearer when accessToken is manually defined (async)', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onGet('custom').reply(config => {
      if (config.headers?.Authorization === 'Bearer accessTokenValue') {
        return [200]
      } else {
        return [401]
      }
    })

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter)

    await auth.setTokensAsync({ access: { value: 'accessTokenValue' } })
    try {
      await axiosInstance.get('custom')
    } catch (error) {
      expect(() => {
        throw error
      }).not.toThrow()
    }

    await auth.setTokensAsync(null)
    try {
      await axiosInstance.get('custom')
      expect(false).toBeTruthy()
    } catch (error) {
      expect(() => {
        throw error
      }).toThrow(/Request failed with status code 401.*/)
    }
  })

  it('sends Bearer when accessToken is manually defined (sync)', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onGet('custom').reply(config => {
      if (config.headers?.Authorization === 'Bearer accessTokenValue') {
        return [200]
      } else {
        return [401]
      }
    })

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter)

    auth.setTokens({ access: { value: 'accessTokenValue' } })
    try {
      await axiosInstance.get('custom')
    } catch (error) {
      expect(() => {
        throw error
      }).not.toThrow()
    }

    auth.setTokens(null)
    try {
      await axiosInstance.get('custom')
      expect(false).toBeTruthy()
    } catch (error) {
      expect(() => {
        throw error
      }).toThrow(/Request failed with status code 401.*/)
    }
  })

  it('fails to set token synchronously when persistentTokenStorage is async', () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onGet('custom').reply(config => {
      if (config.headers?.Authorization === 'Bearer accessTokenValue') {
        return [200]
      } else {
        return [401]
      }
    })

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    const persistentTokenStorage = new TokenStorageAsyncAdapter(new DefaultTokenStorage(localStorage), false)
    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, {
      persistentTokenStorage,
      loadTokensFromStorage: false
    })

    expect(() => auth.setTokens({ access: { value: 'accessTokenValue' } })).toThrow(
      'persistentTokenStorage is async. Use setTokensAsync method instead'
    )
    expect(() => auth.setTokens(null)).toThrow('persistentTokenStorage is async. Use setTokensAsync method instead')
  })

  it('fails to set token synchronously when tokenStorage is async', () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onGet('custom').reply(config => {
      if (config.headers?.Authorization === 'Bearer accessTokenValue') {
        return [200]
      } else {
        return [401]
      }
    })

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    const tokenStorage = new TokenStorageAsyncAdapter(new DefaultTokenStorage(localStorage), false)
    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, {
      tokenStorage,
      loadTokensFromStorage: false
    })

    expect(() => auth.setTokens({ access: { value: 'accessTokenValue' } })).toThrow(
      'tokenStorage is async. Use setTokensAsync method instead'
    )
    expect(() => auth.setTokens(null)).toThrow('tokenStorage is async. Use setTokensAsync method instead')
  })

  it('fails to load token synchronously when persistentTokenStorage is async', () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onGet('custom').reply(config => {
      if (config.headers?.Authorization === 'Bearer accessTokenValue') {
        return [200]
      } else {
        return [401]
      }
    })

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    const persistentTokenStorage = new TokenStorageAsyncAdapter(new DefaultTokenStorage(localStorage), false)
    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, {
      persistentTokenStorage
    })

    expect(() => auth.loadTokensFromStorage()).toThrow(
      'persistentTokenStorage is async. Use loadTokensFromStorageAsync method instead'
    )
  })

  it('fails to load tokens synchronously when tokenStorage is async', () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onGet('custom').reply(config => {
      if (config.headers?.Authorization === 'Bearer accessTokenValue') {
        return [200]
      } else {
        return [401]
      }
    })

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    const tokenStorage = new TokenStorageAsyncAdapter(new DefaultTokenStorage(localStorage), false)
    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, { tokenStorage })

    expect(() => auth.loadTokensFromStorage()).toThrow(
      'tokenStorage is async. Use loadTokensFromStorageAsync method instead'
    )
  })

  it('loads tokens asynchronously when tokenStorage and persistentTokenStorage are sync', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onGet('custom').reply(config => {
      if (config.headers?.Authorization === 'Bearer accessTokenValue') {
        return [200]
      } else {
        return [401]
      }
    })

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter)

    await auth.loadTokensFromStorageAsync()
  })

  it('does not fail when loading tokens asynchronously when tokenStorage and persistentTokenStorage are null', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onGet('custom').reply(config => {
      if (config.headers?.Authorization === 'Bearer accessTokenValue') {
        return [200]
      } else {
        return [401]
      }
    })

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    sessionStorage.setItem('auth.accessToken', 'accessTokenValue')

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, {
      accessTokenDecoder: null,
      tokenStorage: null,
      persistentTokenStorage: null,
      loadTokensFromStorage: false
    })

    await auth.loadTokensFromStorageAsync()
    expect(auth.getTokens()).toBeUndefined()
  })

  it('does not fail when loading tokens asynchronously when tokenStorage is sync and persistentTokenStorage is null', async () => {
    const axiosInstance = axios.create()
    const axiosAdapter = new AxiosAdapter(axiosInstance)

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onGet('custom').reply(config => {
      if (config.headers?.Authorization === 'Bearer accessTokenValue') {
        return [200]
      } else {
        return [401]
      }
    })

    const openidConnectAdapter = new OpenidConnectAdapter()
    const serverConfiguration: ServerConfiguration = {
      loginEndpoint: { method: 'post', url: 'login' }
    }

    sessionStorage.setItem('auth.accessToken', 'accessTokenValue')

    const auth = new Auth(serverConfiguration, openidConnectAdapter, axiosAdapter, {
      accessTokenDecoder: null,
      persistentTokenStorage: null,
      loadTokensFromStorage: false
    })

    await auth.loadTokensFromStorageAsync()
    expect(() => auth.getTokens())
  })
})
