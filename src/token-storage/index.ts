import { Tokens, TokenStorage, TokenStorageAsync } from '..'

export class TokenStorageAsyncAdapter implements TokenStorageAsync {
  readonly async: true = true

  readonly sync?: TokenStorage

  private tokenStorage: TokenStorage

  constructor(tokenStorage: TokenStorage, syncAvailable: boolean = true) {
    this.tokenStorage = tokenStorage
    if (syncAvailable) {
      this.sync = tokenStorage
    }
  }

  async clear(): Promise<void> {
    return await this.tokenStorage.clear()
  }

  async getTokens<C>(): Promise<Tokens<C> | undefined> {
    return await this.tokenStorage.getTokens<C>()
  }

  async store<C>(tokens: Tokens<C>): Promise<void> {
    return await this.tokenStorage.store<C>(tokens)
  }
}

export function toTokenStorageSync(
  tokenStorage: TokenStorage | TokenStorageAsync | null | undefined
): TokenStorage | null | undefined {
  if (!tokenStorage) {
    return tokenStorage
  }
  if (!tokenStorage.async) {
    return tokenStorage
  }
  return tokenStorage.sync
}

export function toTokenStorageAsync(
  tokenStorage: TokenStorage | TokenStorageAsync | null | undefined
): TokenStorageAsync | null | undefined {
  if (!tokenStorage) {
    return tokenStorage
  }
  if (tokenStorage.async) {
    return tokenStorage
  }
  return new TokenStorageAsyncAdapter(tokenStorage)
}