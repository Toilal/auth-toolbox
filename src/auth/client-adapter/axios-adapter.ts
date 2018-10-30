import { ClientAdapter, IAuthInternals, Request, Response, TokenDecoder, UsernamePasswordCredentials } from '..'
import { AxiosBasicCredentials, AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import DefaultTokenDecoder from '../token-decoder/default-token-decoder'

export default class AxiosAdapter implements ClientAdapter<UsernamePasswordCredentials, AxiosRequestConfig, AxiosResponse> {
  private axios: AxiosInstance
  private auth?: AxiosBasicCredentials

  private requestInterceptor?: number
  private responseInterceptor?: number
  private tokenDecoder: TokenDecoder

  constructor (axios: AxiosInstance, auth?: AxiosBasicCredentials, tokenDecoder: TokenDecoder = new DefaultTokenDecoder()) {
    this.axios = axios
    this.auth = auth
    this.tokenDecoder = tokenDecoder
  }

  login (request: Request): Promise<AxiosResponse> {
    return this.axios.request({
      ...request,
      auth: this.auth
    })
  }

  logout (request: Request): Promise<AxiosResponse> {
    return this.axios.request({
      ...request,
      auth: this.auth
    })
  }

  renew (request: Request): Promise<AxiosResponse> {
    return this.axios.request({
      ...request,
      auth: this.auth
    })
  }

  request (request: Request): Promise<AxiosResponse> {
    return this.axios.request({
      ...request
    })
  }

  asResponse (response: AxiosResponse): Response {
    return { data: response.data, headers: response.headers, status: response.status }
  }

  asRequest (request: AxiosRequestConfig): Request {
    if (!request.url) throw new Error('No url is defined')
    if (!request.method) throw new Error('no method is defined')
    return { url: request.url, method: request.method, data: request.data, headers: request.headers }
  }

  init (auth: IAuthInternals<any, AxiosRequestConfig, AxiosResponse>) {
    if (!this.requestInterceptor) {
      this.requestInterceptor = this.axios.interceptors.request.use(async (config) => {
        const request = this.asRequest(config)
        const tokens = auth.getTokens()
        let accessToken = (tokens && tokens.accessToken) ? tokens.accessToken : undefined
        let refreshToken = (tokens && tokens.refreshToken) ? tokens.refreshToken : undefined
        const isLoginRequest = await auth.isLoginRequest(request)
        if (tokens && accessToken && !isLoginRequest) {
          const isRenewRequest = await auth.isRenewRequest(request)
          if (refreshToken && this.tokenDecoder && !isRenewRequest && this.tokenDecoder.isAccessTokenExpired(tokens)) {
            try {
              await auth.renew()
            } catch (err) {
              auth.expired()
              throw err
            }
            const tokens = auth.getTokens()
            accessToken = (tokens && tokens.accessToken) ? tokens.accessToken : undefined
          }
          auth.serverAdapter.setAccessToken(request, accessToken)
          config.data = request.data
          config.headers = request.headers
        }
        return config
      })
    }

    if (!this.responseInterceptor) {
      this.responseInterceptor = this.axios.interceptors.response.use((response: AxiosResponse) => response, async (error: AxiosError) => {
        const tokens = auth.getTokens()
        const refreshToken = tokens && tokens.refreshToken ? tokens.refreshToken : undefined
        if (!error.response || !refreshToken) {
          throw error
        }

        let response = this.asResponse(error.response)
        let request = this.asRequest(error.config)

        const isRenewRequest = await auth.isRenewRequest(request)
        if (!error.response.config || !isRenewRequest &&
          auth.serverAdapter.accessTokenHasExpired(request, response)) {
          // access token has expired

          try {
            await auth.renew()
            error.config.baseURL = undefined // Workaround
            const response = await this.axios.request(error.config)
            return response
          } catch (err) {
            auth.expired()
            throw err
          }
        } else if (error.response && isRenewRequest &&
          auth.serverAdapter.refreshTokenHasExpired(request, response)) {
          auth.expired()
        }

        throw error
      })
    }
  }
}
