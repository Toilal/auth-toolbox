import { Tokens, TokenStorage } from '../index'

export default class DefaultTokenStorage implements TokenStorage {
  private storage: Storage
  private accessTokenStorageKey: string
  private refreshTokenStorageKey: string

  constructor (storage: Storage,
               accessTokenStorageKey = 'auth.accessToken',
               refreshTokenStorageKey = 'auth.refreshToken') {
    this.storage = storage
    this.accessTokenStorageKey = accessTokenStorageKey
    this.refreshTokenStorageKey = refreshTokenStorageKey
  }

  store (tokens: Tokens): any {
    this.storage.setItem(this.accessTokenStorageKey, tokens.accessToken)
    if (tokens.accessTokenExpiresAt) {
      this.storage.setItem(this.accessTokenStorageKey + '.expiresAt', tokens.accessTokenExpiresAt.getTime().toString(10))
    } else {
      this.storage.removeItem(this.accessTokenStorageKey + '.expiresAt')
    }

    if (tokens.refreshToken) {
      this.storage.setItem(this.refreshTokenStorageKey, tokens.refreshToken)
    } else {
      this.storage.removeItem(this.refreshTokenStorageKey)
    }

    if (tokens.refreshTokenExpiresAt) {
      this.storage.setItem(this.refreshTokenStorageKey + '.expiresAt', tokens.refreshTokenExpiresAt.getTime().toString(10))
    } else {
      this.storage.removeItem(this.refreshTokenStorageKey + '.expiresAt')
    }
  }

  clear (): any {
    this.storage.removeItem(this.accessTokenStorageKey)
    this.storage.removeItem(this.refreshTokenStorageKey)

    this.storage.removeItem(this.accessTokenStorageKey + '.expiresAt')
    this.storage.removeItem(this.refreshTokenStorageKey + '.expiresAt')
  }

  getTokens (): Tokens | undefined {
    const accessTokenStr = this.storage.getItem(this.accessTokenStorageKey)
    const refreshTokenStr = this.storage.getItem(this.refreshTokenStorageKey)
    const accessTokenExpiresAtStr = this.storage.getItem(this.accessTokenStorageKey + '.expiresAt')
    const refreshTokenExpiresAtStr = this.storage.getItem(this.refreshTokenStorageKey + '.expiresAt')

    const accessTokenExpiresAt = accessTokenExpiresAtStr ? new Date(parseInt(accessTokenExpiresAtStr, 10)) : undefined
    const refreshTokenExpiresAt = refreshTokenExpiresAtStr ? new Date(parseInt(refreshTokenExpiresAtStr, 10)) : undefined

    const accessToken = accessTokenStr ? accessTokenStr : undefined
    const refreshToken = refreshTokenStr ? refreshTokenStr : undefined

    if (accessToken) {
      return { accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt }
    }
  }
}
