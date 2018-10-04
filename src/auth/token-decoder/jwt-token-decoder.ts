import { TokenDecoder, Tokens } from '..'
import jwtDecode from 'jwt-decode'
import DefaultTokenDecoder from './default-token-decoder'

export default class JwtTokenDecoder extends DefaultTokenDecoder implements TokenDecoder {
  constructor (expiredOffset: number = 0) {
    super(expiredOffset)
  }

  decodeAccessToken (tokens: Tokens): any {
    return jwtDecode(tokens.accessToken)
  }

  decodeRefreshToken (tokens: Tokens): any {
    if (!tokens.refreshToken) return
    return jwtDecode(tokens.refreshToken)
  }

  isAccessTokenExpired (tokens: Tokens): boolean {
    if (super.isAccessTokenExpired(tokens)) {
      return true
    }

    const now = new Date().getTime() + this.expiredOffset
    const decoded = this.decodeAccessToken(tokens)
    if (decoded && decoded.exp < now / 1000) {
      return true
    }

    return false
  }

  isRefreshTokenExpired (tokens: Tokens): boolean {
    if (super.isRefreshTokenExpired(tokens)) {
      return true
    }

    const now = new Date().getTime() + this.expiredOffset
    const decoded = this.decodeRefreshToken(tokens)
    if (decoded && decoded.exp < now / 1000) {
      return true
    }

    return false
  }
}
