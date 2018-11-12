import { DefaultTokenDecoder, Token } from '../../src'

import { advanceTo, clear } from 'jest-date-mock'

describe('Default Token Decoder', () => {
  beforeEach(() => {
    advanceTo(133713371337)
  })

  afterEach(() => {
    clear()
  })

  it('default module is defined', () => {
    expect(DefaultTokenDecoder).toBeDefined()
  })

  it('token is expired', () => {
    const date = new Date()

    const token: Token = { value: 'accessTokenValue', expiresAt: date }

    const tokenDecoder = new DefaultTokenDecoder()

    const accessTokenExpired = tokenDecoder.isExpired(token)
    expect(accessTokenExpired).toBeTruthy()
  })

  it('token is expired when 1 second after expiration', () => {
    const date = new Date()
    date.setSeconds(date.getSeconds() - 1)

    const token: Token = { value: 'accessTokenValue', expiresAt: date }

    const tokenDecoder = new DefaultTokenDecoder()

    const accessTokenExpired = tokenDecoder.isExpired(token)
    expect(accessTokenExpired).toBeTruthy()
  })

  it('token is not expired when 1 second before expiration', () => {
    const date = new Date()
    date.setSeconds(date.getSeconds() + 1)

    const token: Token = { value: 'accessTokenValue', expiresAt: date }

    const tokenDecoder = new DefaultTokenDecoder()

    const accessTokenExpired = tokenDecoder.isExpired(token)
    expect(accessTokenExpired).toBeFalsy()
  })

  it('token is not expired with offset', () => {
    const date = new Date()
    date.setSeconds(date.getSeconds() - 9)

    const token: Token = { value: 'accessTokenValue', expiresAt: date }

    const tokenDecoder = new DefaultTokenDecoder(10)

    const accessTokenExpired = tokenDecoder.isExpired(token)
    expect(accessTokenExpired).toBeFalsy()
  })

  it('token is not expired when expiresAt is not defined', () => {
    const token: Token = { value: 'accessTokenValue' }

    const tokenDecoder = new DefaultTokenDecoder()

    const accessTokenExpired = tokenDecoder.isExpired(token)
    expect(accessTokenExpired).toBeFalsy()
  })
})
