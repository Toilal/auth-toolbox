import { TokenDecoder, Tokens } from '..'

export default class DefaultTokenDecoder implements TokenDecoder {
  protected offset: number

  constructor (offsetSeconds: number = 0) {
    this.offset = offsetSeconds * 1000
  }

  isAccessTokenExpired (tokens: Tokens): boolean {
    if (tokens.accessTokenExpiresAt) {
      const now = new Date().getTime() - this.offset
      if (now >= tokens.accessTokenExpiresAt.getTime()) {
        return true
      }
    }
    return false
  }

  isRefreshTokenExpired (tokens: Tokens): boolean {
    if (tokens.refreshTokenExpiresAt) {
      const now = new Date().getTime() - this.offset
      if (now >= tokens.refreshTokenExpiresAt.getTime()) {
        return true
      }
    }
    return false
  }
}
