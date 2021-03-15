import { Token, TokenDecoder } from '../auth-toolbox'
import { DefaultTokenDecoder } from './default-token-decoder'
import { decode } from 'jsonwebtoken'

/**
 * {@link TokenDecoder} based on jsonwebtoken package to be used with JWT {@link Token}.
 * It check expiration dates from both server response and JWT `exp` claim, and supports decoding
 * of the JWT token.
 *
 * It should be given to {@link Auth} constructor through {@link AuthOptions.accessTokenDecoder}.
 */
export class JwtTokenDecoder extends DefaultTokenDecoder implements TokenDecoder {
  /**
   * @param expiredOffset Offset in millisecond to consider the token as expired.
   *                      use NaN to disable expiration from token decoding
   */
  constructor (expiredOffset: number = 0) {
    super(expiredOffset)
  }

  decode (token: Token): any {
    return decode(token.value)
  }

  isExpired (token: Token, offset?: number): boolean {
    if (super.isExpired(token)) {
      return true
    }

    if (offset === undefined) {
      offset = this.offset
    }

    if (isNaN(offset)) {
      return false
    }

    const now = Math.round((new Date().getTime() - offset) / 1000)
    const decoded = this.decode(token)
    if ('exp' in decoded && now >= decoded.exp) {
      return true
    }

    return false
  }
}
