import { Tokens, TokenStorage } from '..'

export default class DefaultTokenStorage implements TokenStorage {
  readonly async: false = false

  private storage: Storage
  private accessTokenStorageKey: string
  private refreshTokenStorageKey: string
  private expiresAtSuffix: string
  private credentialsTokenStorageKey: string

  constructor(
    storage: Storage,
    accessTokenStorageKey = 'auth.accessToken',
    refreshTokenStorageKey = 'auth.refreshToken',
    expiresAtSuffix = '.expiresAt',
    credentialsTokenStorageKey = 'auth.credentials'
  ) {
    this.storage = storage
    this.accessTokenStorageKey = accessTokenStorageKey
    this.refreshTokenStorageKey = refreshTokenStorageKey
    this.expiresAtSuffix = expiresAtSuffix
    this.credentialsTokenStorageKey = credentialsTokenStorageKey
  }

  store<C>(tokens: Tokens<C>): any {
    this.storage.setItem(this.accessTokenStorageKey, tokens.access.value)

    if (tokens.access.expiresAt) {
      this.storage.setItem(
        this.accessTokenStorageKey + this.expiresAtSuffix,
        tokens.access.expiresAt.getTime().toString(10)
      )
    } else {
      this.storage.removeItem(this.accessTokenStorageKey + this.expiresAtSuffix)
    }

    if (tokens.refresh) {
      this.storage.setItem(this.refreshTokenStorageKey, tokens.refresh.value)
    } else {
      this.storage.removeItem(this.refreshTokenStorageKey)
    }

    if (tokens.refresh && tokens.refresh.expiresAt) {
      this.storage.setItem(
        this.refreshTokenStorageKey + this.expiresAtSuffix,
        tokens.refresh.expiresAt.getTime().toString(10)
      )
    } else {
      this.storage.removeItem(this.refreshTokenStorageKey + this.expiresAtSuffix)
    }

    if (tokens.credentials) {
      this.storage.setItem(this.credentialsTokenStorageKey, JSON.stringify(tokens.credentials))
    } else {
      this.storage.removeItem(this.credentialsTokenStorageKey)
    }
  }

  clear(): any {
    this.storage.removeItem(this.accessTokenStorageKey)
    this.storage.removeItem(this.refreshTokenStorageKey)

    this.storage.removeItem(this.accessTokenStorageKey + this.expiresAtSuffix)
    this.storage.removeItem(this.refreshTokenStorageKey + this.expiresAtSuffix)

    this.storage.removeItem(this.credentialsTokenStorageKey)
  }

  getTokens<C>(): Tokens<C> | undefined {
    const accessTokenStr = this.storage.getItem(this.accessTokenStorageKey)
    const refreshTokenStr = this.storage.getItem(this.refreshTokenStorageKey)
    const accessTokenExpiresAtStr = this.storage.getItem(
      this.accessTokenStorageKey + this.expiresAtSuffix
    )
    const refreshTokenExpiresAtStr = this.storage.getItem(
      this.refreshTokenStorageKey + this.expiresAtSuffix
    )
    const credentialsStr = this.storage.getItem(this.credentialsTokenStorageKey)

    const accessTokenExpiresAt = accessTokenExpiresAtStr
      ? new Date(parseInt(accessTokenExpiresAtStr, 10))
      : undefined
    const refreshTokenExpiresAt = refreshTokenExpiresAtStr
      ? new Date(parseInt(refreshTokenExpiresAtStr, 10))
      : undefined

    const accessToken = accessTokenStr ? accessTokenStr : undefined
    const refreshToken = refreshTokenStr ? refreshTokenStr : undefined
    const credentials = credentialsStr ? JSON.parse(credentialsStr) : undefined

    if (accessToken) {
      const tokens: Tokens<C> = { access: { value: accessToken, expiresAt: accessTokenExpiresAt } }
      if (refreshToken) {
        tokens.refresh = { value: refreshToken, expiresAt: refreshTokenExpiresAt }
      }
      if (credentialsStr) {
        tokens.credentials = credentials
      }
      return tokens
    }
  }
}
