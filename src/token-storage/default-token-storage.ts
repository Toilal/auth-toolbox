import { Tokens, TokenStorage } from '../auth-toolbox'

/**
 * Default implementation of {@link TokenStorage}, delegating to Storage of the browser.
 * (`sessionStorage` or `localStorage`).
 *
 * It should be given to {@link Auth} constructor through {@link AuthOptions.tokenStorage} and
 * {@link AuthOptions.persistentTokenStorage}.
 */
export class DefaultTokenStorage implements TokenStorage {
  readonly async: false = false

  private readonly storage: Storage
  private readonly accessTokenStorageKey: string
  private readonly refreshTokenStorageKey: string
  private readonly expiresAtSuffix: string
  private readonly credentialsTokenStorageKey: string

  constructor (
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

  store<C> (tokens: Tokens<C>): any {
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

    if (tokens.refresh?.expiresAt) {
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

  clear (): any {
    this.storage.removeItem(this.accessTokenStorageKey)
    this.storage.removeItem(this.refreshTokenStorageKey)

    this.storage.removeItem(this.accessTokenStorageKey + this.expiresAtSuffix)
    this.storage.removeItem(this.refreshTokenStorageKey + this.expiresAtSuffix)

    this.storage.removeItem(this.credentialsTokenStorageKey)
  }

  getTokens<C> (): Tokens<C> | undefined {
    const accessTokenString = this.storage.getItem(this.accessTokenStorageKey)
    const refreshTokenString = this.storage.getItem(this.refreshTokenStorageKey)
    const accessTokenExpiresAtString = this.storage.getItem(this.accessTokenStorageKey + this.expiresAtSuffix)
    const refreshTokenExpiresAtString = this.storage.getItem(this.refreshTokenStorageKey + this.expiresAtSuffix)
    const credentialsString = this.storage.getItem(this.credentialsTokenStorageKey)

    const accessTokenExpiresAt = accessTokenExpiresAtString ? new Date(Number.parseInt(accessTokenExpiresAtString, 10)) : undefined
    const refreshTokenExpiresAt = refreshTokenExpiresAtString
      ? new Date(Number.parseInt(refreshTokenExpiresAtString, 10))
      : undefined

    const accessToken = accessTokenString || undefined
    const refreshToken = refreshTokenString || undefined
    const credentials = credentialsString ? JSON.parse(credentialsString) : undefined

    if (accessToken) {
      const tokens: Tokens<C> = { access: { value: accessToken, expiresAt: accessTokenExpiresAt } }
      if (refreshToken) {
        tokens.refresh = { value: refreshToken, expiresAt: refreshTokenExpiresAt }
      }
      if (credentialsString) {
        tokens.credentials = credentials
      }
      return tokens
    }
  }
}
