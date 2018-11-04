import { Tokens, TokenStorage } from '../auth-toolbox'

export default class DefaultTokenStorage implements TokenStorage {
  private storage: Storage
  private accessTokenStorageKey: string
  private refreshTokenStorageKey: string
  private expiresAtSuffix: string

  constructor (storage: Storage,
               accessTokenStorageKey = 'auth.accessToken',
               refreshTokenStorageKey = 'auth.refreshToken',
               expiresAtSuffix = '.expiresAt') {
    this.storage = storage
    this.accessTokenStorageKey = accessTokenStorageKey
    this.refreshTokenStorageKey = refreshTokenStorageKey
    this.expiresAtSuffix = expiresAtSuffix
  }

  store (tokens: Tokens): any {
    this.storage.setItem(this.accessTokenStorageKey, tokens.access.value)

    if (tokens.access.expiresAt) {
      this.storage.setItem(this.accessTokenStorageKey + this.expiresAtSuffix, tokens.access.expiresAt.getTime().toString(10))
    } else {
      this.storage.removeItem(this.accessTokenStorageKey + this.expiresAtSuffix)
    }

    if (tokens.refresh) {
      this.storage.setItem(this.refreshTokenStorageKey, tokens.refresh.value)
    } else {
      this.storage.removeItem(this.refreshTokenStorageKey)
    }

    if (tokens.refresh && tokens.refresh.expiresAt) {
      this.storage.setItem(this.refreshTokenStorageKey + this.expiresAtSuffix, tokens.refresh.expiresAt.getTime().toString(10))
    } else {
      this.storage.removeItem(this.refreshTokenStorageKey + this.expiresAtSuffix)
    }
  }

  clear (): any {
    this.storage.removeItem(this.accessTokenStorageKey)
    this.storage.removeItem(this.refreshTokenStorageKey)

    this.storage.removeItem(this.accessTokenStorageKey + this.expiresAtSuffix)
    this.storage.removeItem(this.refreshTokenStorageKey + this.expiresAtSuffix)
  }

  getTokens (): Tokens | undefined {
    const accessTokenStr = this.storage.getItem(this.accessTokenStorageKey)
    const refreshTokenStr = this.storage.getItem(this.refreshTokenStorageKey)
    const accessTokenExpiresAtStr = this.storage.getItem(this.accessTokenStorageKey + this.expiresAtSuffix)
    const refreshTokenExpiresAtStr = this.storage.getItem(this.refreshTokenStorageKey + this.expiresAtSuffix)

    const accessTokenExpiresAt = accessTokenExpiresAtStr ? new Date(parseInt(accessTokenExpiresAtStr, 10)) : undefined
    const refreshTokenExpiresAt = refreshTokenExpiresAtStr ? new Date(parseInt(refreshTokenExpiresAtStr, 10)) : undefined

    const accessToken = accessTokenStr ? accessTokenStr : undefined
    const refreshToken = refreshTokenStr ? refreshTokenStr : undefined

    if (accessToken) {
      const tokens: Tokens = { access: { value: accessToken, expiresAt: accessTokenExpiresAt } }
      if (refreshToken) {
        tokens.refresh = { value: refreshToken, expiresAt: refreshTokenExpiresAt }
      }
      return tokens
    }
  }
}
