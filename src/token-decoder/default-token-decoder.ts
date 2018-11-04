import { Token, TokenDecoder } from '../auth-toolbox'

export default class DefaultTokenDecoder implements TokenDecoder {
  protected offset: number

  constructor (offsetSeconds: number = 0) {
    this.offset = offsetSeconds * 1000
  }

  isExpired (token: Token): boolean {
    if (token.expiresAt) {
      const now = new Date().getTime() - this.offset
      if (now >= token.expiresAt.getTime()) {
        return true
      }
    }
    return false
  }
}
