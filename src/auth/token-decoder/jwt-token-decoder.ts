import { Token, TokenDecoder } from '..'
import DefaultTokenDecoder from './default-token-decoder'
import * as jwtDecode from 'jwt-decode'

interface JwtToken {
  exp: number
}

export default class JwtTokenDecoder extends DefaultTokenDecoder implements TokenDecoder {
  constructor (expiredOffset: number = 0) {
    super(expiredOffset)
  }

  decode (token: Token): JwtToken | object {
    return jwtDecode(token.value)
  }

  isExpired (token: Token): boolean {
    if (super.isExpired(token)) {
      return true
    }

    const now = Math.round((new Date().getTime() - this.offset) / 1000)
    const decoded = this.decode(token)
    if ('exp' in decoded && now >= decoded.exp) {
      return true
    }

    return false
  }
}
