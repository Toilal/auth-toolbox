import { DefaultTokenStorage, Tokens } from '../../src'

describe('Default Token Storage', () => {
  it('default module is defined', () => {
    expect(DefaultTokenStorage).toBeDefined()
  })

  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  it('store accessToken in default storage key', () => {
    const tokens: Tokens = {
      access: { value: 'accessTokenValue' }
    }

    const tokenStorage = new DefaultTokenStorage(sessionStorage)
    tokenStorage.store(tokens)

    expect(sessionStorage.getItem('auth.accessToken')).toBe('accessTokenValue')
    expect(sessionStorage.getItem('auth.refreshToken')).toBeNull()
  })

  it('store accessToken in custom storage key', () => {
    const tokens: Tokens = {
      access: { value: 'accessTokenValue' }
    }

    const tokenStorage = new DefaultTokenStorage(sessionStorage, 'customAccessTokenKey', 'customRefreshTokenKey')
    tokenStorage.store(tokens)

    expect(sessionStorage.getItem('customAccessTokenKey')).toBe('accessTokenValue')
    expect(sessionStorage.getItem('customRefreshTokenKey')).toBeNull()
  })

  it('store refreshToken in default storage key', () => {
    const tokens: Tokens = {
      access: { value: 'accessTokenValue' },
      refresh: { value: 'refreshTokenValue' }
    }

    const tokenStorage = new DefaultTokenStorage(sessionStorage)
    tokenStorage.store(tokens)

    expect(sessionStorage.getItem('auth.accessToken')).toBe('accessTokenValue')
    expect(sessionStorage.getItem('auth.refreshToken')).toBe('refreshTokenValue')
  })

  it('store refreshToken in custom storage key', () => {
    const tokens: Tokens = {
      access: { value: 'accessTokenValue' },
      refresh: { value: 'refreshTokenValue' }
    }

    const tokenStorage = new DefaultTokenStorage(sessionStorage, 'customAccessTokenKey', 'customRefreshTokenKey')
    tokenStorage.store(tokens)

    expect(sessionStorage.getItem('customAccessTokenKey')).toBe('accessTokenValue')
    expect(sessionStorage.getItem('customRefreshTokenKey')).toBe('refreshTokenValue')
  })

  it('store expiration dates in default storage key', () => {
    const accessDate = new Date()
    const refreshDate = new Date()
    refreshDate.setSeconds(accessDate.getSeconds() + 1)

    const tokens: Tokens = {
      access: { value: 'accessTokenValue', expiresAt: accessDate },
      refresh: { value: 'refreshTokenValue', expiresAt: refreshDate }
    }

    const tokenStorage = new DefaultTokenStorage(sessionStorage)
    tokenStorage.store(tokens)

    expect(sessionStorage.getItem('auth.accessToken')).toBe('accessTokenValue')
    expect(sessionStorage.getItem('auth.refreshToken')).toBe('refreshTokenValue')
    expect(sessionStorage.getItem('auth.accessToken.expiresAt')).toBe(accessDate.getTime().toString(10))
    expect(sessionStorage.getItem('auth.refreshToken.expiresAt')).toBe(refreshDate.getTime().toString(10))
  })

  it('store expiration dates in custom storage key', () => {
    const accessDate = new Date()
    const refreshDate = new Date()
    refreshDate.setSeconds(accessDate.getSeconds() + 1)

    const tokens: Tokens = {
      access: { value: 'accessTokenValue', expiresAt: accessDate },
      refresh: { value: 'refreshTokenValue', expiresAt: refreshDate }
    }

    const tokenStorage = new DefaultTokenStorage(
      sessionStorage,
      'customAccessTokenKey',
      'customRefreshTokenKey',
      '.exp'
    )
    tokenStorage.store(tokens)

    expect(sessionStorage.getItem('customAccessTokenKey')).toBe('accessTokenValue')
    expect(sessionStorage.getItem('customRefreshTokenKey')).toBe('refreshTokenValue')
    expect(sessionStorage.getItem('customAccessTokenKey.exp')).toBe(accessDate.getTime().toString(10))
    expect(sessionStorage.getItem('customRefreshTokenKey.exp')).toBe(refreshDate.getTime().toString(10))
  })

  it('clear tokens in default storage key', () => {
    const accessDate = new Date()
    const refreshDate = new Date()
    refreshDate.setSeconds(accessDate.getSeconds() + 1)

    sessionStorage.setItem('auth.accessToken', 'accessTokenValue')
    sessionStorage.setItem('auth.accessToken.expiresAt', 'expiresAt')
    sessionStorage.setItem('auth.refreshToken', 'refreshTokenValue')
    sessionStorage.setItem('auth.refreshToken.expiresAt', 'expiresAt')

    const tokenStorage = new DefaultTokenStorage(sessionStorage)
    tokenStorage.clear()

    expect(sessionStorage.getItem('auth.accessToken')).toBeNull()
    expect(sessionStorage.getItem('auth.accessToken.expiresAt')).toBeNull()

    expect(sessionStorage.getItem('auth.refreshToken')).toBeNull()
    expect(sessionStorage.getItem('auth.refreshToken.expiresAt')).toBeNull()
  })

  it('clear tokens in custom storage key', () => {
    const accessDate = new Date()
    const refreshDate = new Date()
    refreshDate.setSeconds(accessDate.getSeconds() + 1)

    sessionStorage.setItem('customAccessTokenKey', 'accessTokenValue')
    sessionStorage.setItem('customAccessTokenKey.exp', 'expiresAt')
    sessionStorage.setItem('customRefreshTokenKey', 'refreshTokenValue')
    sessionStorage.setItem('customRefreshTokenKey.exp', 'expiresAt')

    const tokenStorage = new DefaultTokenStorage(
      sessionStorage,
      'customAccessTokenKey',
      'customRefreshTokenKey',
      '.exp'
    )
    tokenStorage.clear()

    expect(sessionStorage.getItem('customAccessTokenKey')).toBeNull()
    expect(sessionStorage.getItem('customAccessTokenKey.exp')).toBeNull()

    expect(sessionStorage.getItem('customRefreshTokenKey')).toBeNull()
    expect(sessionStorage.getItem('customRefreshTokenKey.exp')).toBeNull()
  })

  it('get tokens when access token is defined', () => {
    const accessDate = new Date()
    const refreshDate = new Date()
    refreshDate.setSeconds(accessDate.getSeconds() + 1)

    sessionStorage.setItem('auth.accessToken', 'accessTokenValue')
    sessionStorage.setItem('auth.accessToken.expiresAt', accessDate.getTime().toString(10))
    sessionStorage.setItem('auth.refreshToken', 'refreshTokenValue')
    sessionStorage.setItem('auth.refreshToken.expiresAt', refreshDate.getTime().toString(10))

    const tokenStorage = new DefaultTokenStorage(sessionStorage)
    const tokens = tokenStorage.getTokens()

    expect(tokens).toBeDefined()
    if (tokens != null) {
      expect(tokens.access.value).toBe('accessTokenValue')
      expect(tokens.access.expiresAt).toEqual(accessDate)
      expect(tokens.refresh).toBeDefined()
      if (tokens.refresh != null) {
        expect(tokens.refresh.value).toBe('refreshTokenValue')
        expect(tokens.refresh.expiresAt).toEqual(refreshDate)
      }
    }
  })

  it('get undefined tokens when no access token is defined', () => {
    const accessDate = new Date()
    const refreshDate = new Date()
    refreshDate.setSeconds(accessDate.getSeconds() + 1)

    sessionStorage.setItem('customAccessTokenKey.exp', accessDate.getTime().toString(10))
    sessionStorage.setItem('customRefreshTokenKey', 'refreshTokenValue')
    sessionStorage.setItem('customRefreshTokenKey.exp', refreshDate.getTime().toString(10))

    const tokenStorage = new DefaultTokenStorage(
      sessionStorage,
      'customAccessTokenKey',
      'customRefreshTokenKey',
      '.exp'
    )
    expect(tokenStorage.getTokens()).toBeUndefined()
  })
})
