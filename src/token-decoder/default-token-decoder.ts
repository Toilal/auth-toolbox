import { Token, TokenDecoder } from '../auth-toolbox'

/**
 * Default implementation of {@link TokenDecoder}. It doesn't support decoding {@link Token} and checks the
 * expiration date from the server response.
 *
 * It's the default value on {@link Auth} constructor for {@link AuthOptions.accessTokenDecoder}.
 */
export class DefaultTokenDecoder implements TokenDecoder {
  protected offset: number

  constructor (offsetSeconds: number = 0) {
    this.offset = offsetSeconds * 1000
  }

  isExpired (token: Token): boolean {
    if (token.expiresAt) {
      const now = Date.now() - this.offset
      if (now >= token.expiresAt.getTime()) {
        return true
      }
    }
    return false
  }
}
