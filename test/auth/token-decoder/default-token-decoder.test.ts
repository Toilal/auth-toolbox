import DefaultTokenDecoder from '../../../src/auth/token-decoder/default-token-decoder'
import { Tokens } from '../../../src/auth'

import { advanceTo, clear } from 'jest-date-mock';

describe('Default Token Decoder', () => {
  beforeAll(() => {
    advanceTo(133713371337)
  })

  afterAll(() => {
    clear()
  })

  it('default module is defined', () => {
    expect(DefaultTokenDecoder).toBeDefined()
  })

  it('check accessToken is expired', () => {
    const date = new Date()

    const tokens: Tokens = {
      accessToken: 'accessTokenValue',
      accessTokenExpiresAt: date
    }

    const tokenDecoder = new DefaultTokenDecoder()

    const accessTokenExpired = tokenDecoder.isAccessTokenExpired(tokens)
    expect(accessTokenExpired).toBeTruthy()
  })

  it('check accessToken is expired when 1 second after expiration', () => {
    const date = new Date()
    date.setSeconds(date.getSeconds() - 1)

    const tokens: Tokens = {
      accessToken: 'accessTokenValue',
      accessTokenExpiresAt: date
    }

    const tokenDecoder = new DefaultTokenDecoder()

    const accessTokenExpired = tokenDecoder.isAccessTokenExpired(tokens)
    expect(accessTokenExpired).toBeTruthy()
  })

  it('check accessToken is not expired when 1 second before expiration', () => {
    const date = new Date()
    date.setSeconds(date.getSeconds() + 1)

    const tokens: Tokens = {
      accessToken: 'accessTokenValue',
      accessTokenExpiresAt: date
    }

    const tokenDecoder = new DefaultTokenDecoder()

    const accessTokenExpired = tokenDecoder.isAccessTokenExpired(tokens)
    expect(accessTokenExpired).toBeFalsy()
  })

  it('check accessToken is not expired with offset', () => {
    const date = new Date()
    date.setSeconds(date.getSeconds() - 9)

    const tokens: Tokens = {
      accessToken: 'accessTokenValue',
      accessTokenExpiresAt: date
    }

    const tokenDecoder = new DefaultTokenDecoder(10)

    const accessTokenExpired = tokenDecoder.isAccessTokenExpired(tokens)
    expect(accessTokenExpired).toBeFalsy()
  })

  it('check accessToken is not expired when expiresAt is not defined', () => {
    const tokens: Tokens = {
      accessToken: 'accessTokenValue'
    }

    const tokenDecoder = new DefaultTokenDecoder()

    const accessTokenExpired = tokenDecoder.isAccessTokenExpired(tokens)
    expect(accessTokenExpired).toBeFalsy()
  })

  it('check refreshToken is expired with offset', () => {
    const date = new Date()
    date.setSeconds(date.getSeconds() - 10)

    const tokens: Tokens = {
      accessToken: 'accessTokenValue',
      refreshToken: 'refreshTokenValue',
      refreshTokenExpiresAt: date
    }

    const tokenDecoder = new DefaultTokenDecoder(10)

    const refreshTokenExpired = tokenDecoder.isRefreshTokenExpired(tokens)
    expect(refreshTokenExpired).toBeTruthy()
  })

  it('check refreshToken is expired', () => {
    const date = new Date()

    const tokens: Tokens = {
      accessToken: 'accessTokenValue',
      refreshToken: 'refreshTokenValue',
      refreshTokenExpiresAt: date
    }

    const tokenDecoder = new DefaultTokenDecoder()

    const refreshTokenExpired = tokenDecoder.isRefreshTokenExpired(tokens)
    expect(refreshTokenExpired).toBeTruthy()
  })

  it('check refreshToken is expired', () => {
    const date = new Date()
    date.setSeconds(date.getSeconds() - 1)

    const tokens: Tokens = {
      accessToken: 'accessTokenValue',
      refreshToken: 'refreshTokenValue',
      refreshTokenExpiresAt: date
    }

    const tokenDecoder = new DefaultTokenDecoder()

    const refreshTokenExpired = tokenDecoder.isRefreshTokenExpired(tokens)
    expect(refreshTokenExpired).toBeTruthy()
  })

  it('check refreshToken is not expired', () => {
    const date = new Date()
    date.setSeconds(date.getSeconds() + 1)

    const tokens: Tokens = {
      accessToken: 'accessTokenValue',
      refreshToken: 'refreshTokenValue',
      refreshTokenExpiresAt: date
    }

    const tokenDecoder = new DefaultTokenDecoder()

    const refreshTokenExpired = tokenDecoder.isRefreshTokenExpired(tokens)
    expect(refreshTokenExpired).toBeFalsy()
  })

  it('check refreshToken is not expired with offset', () => {
    const date = new Date()
    date.setSeconds(date.getSeconds() - 9)

    const tokens: Tokens = {
      accessToken: 'accessTokenValue',
      refreshToken: 'refreshTokenValue',
      refreshTokenExpiresAt: date
    }

    const tokenDecoder = new DefaultTokenDecoder(10)

    const refreshTokenExpired = tokenDecoder.isRefreshTokenExpired(tokens)
    expect(refreshTokenExpired).toBeFalsy()
  })

  it('check refreshToken is expired with offset', () => {
    const date = new Date()
    date.setSeconds(date.getSeconds() - 10)

    const tokens: Tokens = {
      accessToken: 'accessTokenValue',
      refreshToken: 'refreshTokenValue',
      refreshTokenExpiresAt: date
    }

    const tokenDecoder = new DefaultTokenDecoder(10)

    const refreshTokenExpired = tokenDecoder.isRefreshTokenExpired(tokens)
    expect(refreshTokenExpired).toBeTruthy()
  })

  it('check refreshToken is not expired when expiresAt is not defined', () => {
    const tokens: Tokens = {
      accessToken: 'accessTokenValue',
      refreshToken: 'refreshTokenValue'
    }

    const tokenDecoder = new DefaultTokenDecoder()

    const refreshTokenExpired = tokenDecoder.isRefreshTokenExpired(tokens)
    expect(refreshTokenExpired).toBeFalsy()
  })
})
