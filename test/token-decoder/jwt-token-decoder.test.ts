import JwtTokenDecoder from '../../src/token-decoder/jwt-token-decoder'
import { Token } from '../../src/auth-toolbox'

import { advanceTo, clear } from 'jest-date-mock'

describe('Jwt Token Decoder', () => {
  const accessToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJKd3QgVG9vbGJveCIsImlhdCI6MTMzNzEzMzExLCJleHAiOjEzMzcxMzM3MSwiYXVkIjoiand0LXRvb2xib3giLCJzdWIiOiJqd3QtdG9vbGJveCJ9.uXiL5Yu-Ip0iNkvmK54U5MHDEhE0M6KsNFAb-BWg6oQ'

  const accessTokenExpNow = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJKd3QgVG9vbGJveCIsImlhdCI6MTMzNzEzMzExLCJleHAiOjEzMzcxMzM3MSwiYXVkIjoiand0LXRvb2xib3giLCJzdWIiOiJqd3QtdG9vbGJveCJ9.uXiL5Yu-Ip0iNkvmK54U5MHDEhE0M6KsNFAb-BWg6oQ'
  const accessTokenExpNowMinus1 = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJKd3QgVG9vbGJveCIsImlhdCI6MTMzNzEzMzExLCJleHAiOjEzMzcxMzM3MCwiYXVkIjoiand0LXRvb2xib3giLCJzdWIiOiJqd3QtdG9vbGJveCJ9.5qqM6z2xTN_DqFCJYJeRxFlbMKJ0AyIrudGqvHCke3g'
  const accessTokenExpNowPlus1 = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJKd3QgVG9vbGJveCIsImlhdCI6MTMzNzEzMzExLCJleHAiOjEzMzcxMzM3MiwiYXVkIjoiand0LXRvb2xib3giLCJzdWIiOiJqd3QtdG9vbGJveCJ9.LiBxgT3VwrIp7oOfBWbEcKRFIQXqX8idxdhdA3N8D7Q'

  const accessTokenExpNowMinus11 = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJKd3QgVG9vbGJveCIsImlhdCI6MTMzNzEzMzExLCJleHAiOjEzMzcxMzM2MCwiYXVkIjoiand0LXRvb2xib3giLCJzdWIiOiJqd3QtdG9vbGJveCJ9.Hi8qnDCMQscUsfb2PmOMjnla67DPa_bTaGY0PntKdAQ'
  const accessTokenExpNowMinus10 = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJKd3QgVG9vbGJveCIsImlhdCI6MTMzNzEzMzExLCJleHAiOjEzMzcxMzM2MSwiYXVkIjoiand0LXRvb2xib3giLCJzdWIiOiJqd3QtdG9vbGJveCJ9.FTB2JxqDgVwZH7WPEKsENtbXZ3l01w-bbZJQqfY0xc8'
  const accessTokenExpNowMinus9 = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJKd3QgVG9vbGJveCIsImlhdCI6MTMzNzEzMzExLCJleHAiOjEzMzcxMzM2MiwiYXVkIjoiand0LXRvb2xib3giLCJzdWIiOiJqd3QtdG9vbGJveCJ9.feOjEJUK5lS80e9tysEty6c3E15A9xyNl5RcFeBzz5k'


  beforeEach(() => {
    advanceTo(133713371337)
  })

  afterEach(() => {
    clear()
  })

  it('default module is defined', () => {
    expect(JwtTokenDecoder).toBeDefined()
  })

  it('decode token', () => {
    const token: Token = { value: accessToken }

    const tokenDecoder = new JwtTokenDecoder()
    const decoded = tokenDecoder.decode(token)
    expect(decoded).toEqual({
      'iss': 'Jwt Toolbox',
      'iat': 133713311,
      'exp': 133713371,
      'aud': 'jwt-toolbox',
      'sub': 'jwt-toolbox'
    })
  })

  it('check token is expired', () => {
    const token: Token = { value: accessTokenExpNow }

    const tokenDecoder = new JwtTokenDecoder()

    const accessTokenExpired = tokenDecoder.isExpired(token)
    expect(accessTokenExpired).toBeTruthy()
  })

  it('check token is expired when 1 second after expiration', () => {
    const token: Token = { value: accessTokenExpNowMinus1 }

    const tokenDecoder = new JwtTokenDecoder()

    const accessTokenExpired = tokenDecoder.isExpired(token)
    expect(accessTokenExpired).toBeTruthy()
  })

  it('check token is not expired when 1 second before expiration', () => {
    const token: Token = { value: accessTokenExpNowPlus1 }

    const tokenDecoder = new JwtTokenDecoder()

    const accessTokenExpired = tokenDecoder.isExpired(token)
    expect(accessTokenExpired).toBeFalsy()
  })

  it('check token is not expired with offset', () => {
    const token: Token = { value: accessTokenExpNowMinus9 }

    const tokenDecoder = new JwtTokenDecoder(10)

    const accessTokenExpired = tokenDecoder.isExpired(token)
    expect(accessTokenExpired).toBeFalsy()
  })

  it('check token is expired with offset', () => {
    const token: Token = { value: accessTokenExpNowMinus10 }

    const tokenDecoder = new JwtTokenDecoder(10)

    const accessTokenExpired = tokenDecoder.isExpired(token)
    expect(accessTokenExpired).toBeTruthy()
  })
})
