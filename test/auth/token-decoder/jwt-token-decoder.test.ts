import JwtTokenDecoder from '../../../src/auth/token-decoder/jwt-token-decoder'
import { Tokens } from '../../../src/auth'

import { advanceTo, clear } from 'jest-date-mock'

describe('Jwt Token Decoder', () => {
  const accessToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJKd3QgVG9vbGJveCIsImlhdCI6MTMzNzEzMzExLCJleHAiOjEzMzcxMzM3MSwiYXVkIjoiand0LXRvb2xib3giLCJzdWIiOiJqd3QtdG9vbGJveCJ9.uXiL5Yu-Ip0iNkvmK54U5MHDEhE0M6KsNFAb-BWg6oQ'
  const refreshToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJKd3QgVG9vbGJveCIsImlhdCI6MTMzNzEzMzExLCJleHAiOjEzMzcxMzM3MSwiYXVkIjoiand0LXRvb2xib3giLCJzdWIiOiJqd3QtdG9vbGJveCIsInJlZnJlc2giOiJ0cnVlIn0.TlkC9Ga4c3w8Z2LsyQ4sLPbtq1jm78PwXGbfuimpFAg'

  const accessTokenExpNow = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJKd3QgVG9vbGJveCIsImlhdCI6MTMzNzEzMzExLCJleHAiOjEzMzcxMzM3MSwiYXVkIjoiand0LXRvb2xib3giLCJzdWIiOiJqd3QtdG9vbGJveCJ9.uXiL5Yu-Ip0iNkvmK54U5MHDEhE0M6KsNFAb-BWg6oQ'
  const accessTokenExpNowMinus1 = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJKd3QgVG9vbGJveCIsImlhdCI6MTMzNzEzMzExLCJleHAiOjEzMzcxMzM3MCwiYXVkIjoiand0LXRvb2xib3giLCJzdWIiOiJqd3QtdG9vbGJveCJ9.5qqM6z2xTN_DqFCJYJeRxFlbMKJ0AyIrudGqvHCke3g'
  const accessTokenExpNowPlus1 = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJKd3QgVG9vbGJveCIsImlhdCI6MTMzNzEzMzExLCJleHAiOjEzMzcxMzM3MiwiYXVkIjoiand0LXRvb2xib3giLCJzdWIiOiJqd3QtdG9vbGJveCJ9.LiBxgT3VwrIp7oOfBWbEcKRFIQXqX8idxdhdA3N8D7Q'

  const accessTokenExpNowMinus11 = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJKd3QgVG9vbGJveCIsImlhdCI6MTMzNzEzMzExLCJleHAiOjEzMzcxMzM2MCwiYXVkIjoiand0LXRvb2xib3giLCJzdWIiOiJqd3QtdG9vbGJveCJ9.Hi8qnDCMQscUsfb2PmOMjnla67DPa_bTaGY0PntKdAQ'
  const accessTokenExpNowMinus10 = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJKd3QgVG9vbGJveCIsImlhdCI6MTMzNzEzMzExLCJleHAiOjEzMzcxMzM2MSwiYXVkIjoiand0LXRvb2xib3giLCJzdWIiOiJqd3QtdG9vbGJveCJ9.FTB2JxqDgVwZH7WPEKsENtbXZ3l01w-bbZJQqfY0xc8'
  const accessTokenExpNowMinus9 = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJKd3QgVG9vbGJveCIsImlhdCI6MTMzNzEzMzExLCJleHAiOjEzMzcxMzM2MiwiYXVkIjoiand0LXRvb2xib3giLCJzdWIiOiJqd3QtdG9vbGJveCJ9.feOjEJUK5lS80e9tysEty6c3E15A9xyNl5RcFeBzz5k'


  beforeAll(() => {
    advanceTo(133713371337)
  })

  afterAll(() => {
    clear()
  })

  it('default module is defined', () => {
    expect(JwtTokenDecoder).toBeDefined()
  })

  it('decode accessToken', () => {
    const tokens: Tokens = {
      accessToken
    }

    const tokenDecoder = new JwtTokenDecoder()
    const decoded = tokenDecoder.decodeAccessToken(tokens)
    expect(decoded).toEqual({
        'iss': 'Jwt Toolbox',
        'iat': 133713311,
        'exp': 133713371,
        'aud': 'jwt-toolbox',
        'sub': 'jwt-toolbox'
      })
  })

  it('decode refreshToken', () => {
    const tokens: Tokens = {
      accessToken,
      refreshToken
    }

    const tokenDecoder = new JwtTokenDecoder()
    const decoded = tokenDecoder.decodeRefreshToken(tokens)
    expect(decoded).toEqual({
        'iss': 'Jwt Toolbox',
        'iat': 133713311,
        'exp': 133713371,
        'aud': 'jwt-toolbox',
        'sub': 'jwt-toolbox',
        'refresh': 'true'
      })
  })

  it('check accessToken is expired', () => {
    const tokens: Tokens = {
      accessToken: accessTokenExpNow
    }

    const tokenDecoder = new JwtTokenDecoder()

    const accessTokenExpired = tokenDecoder.isAccessTokenExpired(tokens)
    expect(accessTokenExpired).toBeTruthy()
  })

  it('check accessToken is expired when 1 second after expiration', () => {
    const tokens: Tokens = {
      accessToken: accessTokenExpNowMinus1
    }

    const tokenDecoder = new JwtTokenDecoder()

    const accessTokenExpired = tokenDecoder.isAccessTokenExpired(tokens)
    expect(accessTokenExpired).toBeTruthy()
  })

  it('check accessToken is not expired when 1 second before expiration', () => {
    const tokens: Tokens = {
      accessToken: accessTokenExpNowPlus1
    }

    const tokenDecoder = new JwtTokenDecoder()

    const accessTokenExpired = tokenDecoder.isAccessTokenExpired(tokens)
    expect(accessTokenExpired).toBeFalsy()
  })

  it('check accessToken is not expired with offset', () => {
    const tokens: Tokens = {
      accessToken: accessTokenExpNowMinus9
    }

    const tokenDecoder = new JwtTokenDecoder(10)

    const accessTokenExpired = tokenDecoder.isAccessTokenExpired(tokens)
    expect(accessTokenExpired).toBeFalsy()
  })

  it('check accessToken is expired with offset', () => {
    const tokens: Tokens = {
      accessToken: accessTokenExpNowMinus10
    }

    const tokenDecoder = new JwtTokenDecoder(10)

    const accessTokenExpired = tokenDecoder.isAccessTokenExpired(tokens)
    expect(accessTokenExpired).toBeTruthy()
  })

  it('check refreshToken is expired with offset', () => {
    const tokens: Tokens = {
      accessToken: '',
      refreshToken: accessTokenExpNowMinus10,
    }

    const tokenDecoder = new JwtTokenDecoder(10)

    const refreshTokenExpired = tokenDecoder.isRefreshTokenExpired(tokens)
    expect(refreshTokenExpired).toBeTruthy()
  })

  it('check refreshToken is expired', () => {
    const tokens: Tokens = {
      accessToken: '',
      refreshToken: accessTokenExpNow
    }

    const tokenDecoder = new JwtTokenDecoder()

    const refreshTokenExpired = tokenDecoder.isRefreshTokenExpired(tokens)
    expect(refreshTokenExpired).toBeTruthy()
  })

  it('check refreshToken is expired', () => {
    const tokens: Tokens = {
      accessToken: '',
      refreshToken: accessTokenExpNowMinus1
    }

    const tokenDecoder = new JwtTokenDecoder()

    const refreshTokenExpired = tokenDecoder.isRefreshTokenExpired(tokens)
    expect(refreshTokenExpired).toBeTruthy()
  })

  it('check refreshToken is not expired', () => {
    const tokens: Tokens = {
      accessToken: '',
      refreshToken: accessTokenExpNowPlus1
    }

    const tokenDecoder = new JwtTokenDecoder()

    const refreshTokenExpired = tokenDecoder.isRefreshTokenExpired(tokens)
    expect(refreshTokenExpired).toBeFalsy()
  })

  it('check refreshToken is not expired with offset', () => {
    const tokens: Tokens = {
      accessToken: '',
      refreshToken: accessTokenExpNowMinus9
    }

    const tokenDecoder = new JwtTokenDecoder(10)

    const refreshTokenExpired = tokenDecoder.isRefreshTokenExpired(tokens)
    expect(refreshTokenExpired).toBeFalsy()
  })

  it('check refreshToken is expired with offset', () => {
    const tokens: Tokens = {
      accessToken: '',
      refreshToken: accessTokenExpNowMinus10
    }

    const tokenDecoder = new JwtTokenDecoder(10)

    const refreshTokenExpired = tokenDecoder.isRefreshTokenExpired(tokens)
    expect(refreshTokenExpired).toBeTruthy()
  })
})
