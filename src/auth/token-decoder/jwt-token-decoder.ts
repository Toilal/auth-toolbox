import { TokenDecoder, Tokens } from '..'
import DefaultTokenDecoder from './default-token-decoder'
import * as jwtDecode from 'jwt-decode'

interface JwtToken {
  exp: number
}

export default class JwtTokenDecoder extends DefaultTokenDecoder implements TokenDecoder {
  constructor (expiredOffset: number = 0) {
    super(expiredOffset)
  }

  decodeAccessToken (tokens: Tokens): JwtToken | object {
    return jwtDecode(tokens.accessToken)
  }

  decodeRefreshToken (tokens: Tokens): JwtToken | object | undefined {
    if (!tokens.refreshToken) return
    return jwtDecode(tokens.refreshToken)
  }

  isAccessTokenExpired (tokens: Tokens): boolean {
    if (super.isAccessTokenExpired(tokens)) {
      return true
    }

    const now = Math.round((new Date().getTime() - this.offset) / 1000)
    const decoded = this.decodeAccessToken(tokens)
    console.log(now)
    console.log((decoded as any).exp)
    if ('exp' in decoded && now >= decoded.exp) {
      return true
    }

    return false
  }

  isRefreshTokenExpired (tokens: Tokens): boolean {
    if (super.isRefreshTokenExpired(tokens)) {
      return true
    }

    const now = Math.round((new Date().getTime() - this.offset) / 1000)
    const decoded = this.decodeRefreshToken(tokens)
    if (decoded && 'exp' in decoded && now >= decoded.exp) {
      return true
    }

    return false
  }
}
