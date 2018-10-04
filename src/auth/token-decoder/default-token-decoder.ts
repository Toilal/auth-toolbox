import { TokenDecoder, Tokens } from '..'

export default class DefaultTokenDecoder implements TokenDecoder {
  protected expiredOffset: number

  constructor (expiredOffset: number = 0) {
    this.expiredOffset = expiredOffset
  }

  isAccessTokenExpired (tokens: Tokens): boolean {
    if (tokens.accessTokenExpiresAt) {
      const now = new Date().getTime() + this.expiredOffset
      if (tokens.accessTokenExpiresAt.getTime() < now) {
        return true
      }
    }
    return false
  }

  isRefreshTokenExpired (tokens: Tokens): boolean {
    if (tokens.refreshTokenExpiresAt) {
      const now = new Date().getTime() + this.expiredOffset
      if (tokens.refreshTokenExpiresAt.getTime() < now) {
        return true
      }
    }
    return false
  }
}
