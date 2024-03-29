import { DefaultTokenStorage, Tokens, toTokenStorageAsync, toTokenStorageSync } from '../../src'

describe('toTokenStorageAsync', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  it('converts DefaultTokenStorage to async', async () => {
    const tokens: Tokens = {
      access: { value: 'accessTokenValue' }
    }

    const syncTokenStorage = new DefaultTokenStorage(sessionStorage)
    const tokenStorage = toTokenStorageAsync(syncTokenStorage)

    expect(tokenStorage).toBeDefined()
    expect(tokenStorage).not.toBeNull()

    if (tokenStorage != null) {
      expect(syncTokenStorage.async).toBe(false)
      expect(tokenStorage.async).toBe(true)
      expect(tokenStorage.sync).toBe(syncTokenStorage)

      await tokenStorage.store(tokens)
      const loadedTokens = await tokenStorage.getTokens()

      expect(loadedTokens).toEqual(tokens)

      await tokenStorage.clear()
      const loadedTokens2 = await tokenStorage.getTokens()

      expect(loadedTokens2).toBeUndefined()
    }
  })

  it('does nothing when null', () => {
    expect(toTokenStorageAsync(null)).toBeNull()
    expect(toTokenStorageAsync(null)).toBeNull()
  })

  it('does nothing when undefined', () => {
    expect(toTokenStorageAsync()).toBeUndefined()
    expect(toTokenStorageAsync()).toBeUndefined()
  })

  it('does nothing when already async', () => {
    const syncTokenStorage = new DefaultTokenStorage(sessionStorage)
    const tokenStorage = toTokenStorageAsync(syncTokenStorage)

    const sameTokenStorage = toTokenStorageAsync(tokenStorage)

    expect(sameTokenStorage).toBe(tokenStorage)
  })
})

describe('toTokenStorageSync', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  it('converts async tokenStorage to syncTokenStorage if sync is defined', () => {
    const syncTokenStorage = new DefaultTokenStorage(sessionStorage)
    const asyncTokenStorage = toTokenStorageAsync(syncTokenStorage)

    expect(asyncTokenStorage).toBeDefined()
    expect(asyncTokenStorage).not.toBeNull()

    if (asyncTokenStorage != null) {
      const tokenStorage = toTokenStorageSync(asyncTokenStorage)

      expect(tokenStorage).toBeDefined()
      expect(tokenStorage).not.toBeNull()

      if (tokenStorage != null) {
        expect(tokenStorage).toBe(syncTokenStorage)
      }
    }
  })

  it('does nothing when null', () => {
    expect(toTokenStorageSync(null)).toBeNull()
    expect(toTokenStorageSync(null)).toBeNull()
  })

  it('does nothing when undefined', () => {
    expect(toTokenStorageSync()).toBeUndefined()
    expect(toTokenStorageSync()).toBeUndefined()
  })

  it('does nothing when already async', () => {
    const syncTokenStorage = new DefaultTokenStorage(sessionStorage)
    const tokenStorage = toTokenStorageSync(syncTokenStorage)

    expect(tokenStorage).toBe(syncTokenStorage)
  })
})
