import { AsRequestError } from '.'
import { ClientAdapter, IAuthInternals, Request, Response, UsernamePasswordCredentials } from '..'
import { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

export default class AxiosAdapter implements ClientAdapter<UsernamePasswordCredentials, AxiosRequestConfig, AxiosResponse> {
  private axios: AxiosInstance
  private config: AxiosRequestConfig

  private requestInterceptor?: number
  private responseInterceptor?: number

  constructor (axios: AxiosInstance, config: AxiosRequestConfig = {}) {
    this.axios = axios
    this.config = config
  }

  login (request: Request): Promise<AxiosResponse> {
    return this.axios.request({
      ...this.config,
      ...request
    })
  }

  logout (request: Request): Promise<AxiosResponse> {
    return this.axios.request({
      ...this.config,
      ...request
    })
  }

  renew (request: Request): Promise<AxiosResponse> {
    return this.axios.request({
      ...this.config,
      ...request
    })
  }

  request (request: Request): Promise<AxiosResponse> {
    return this.axios.request({
      ...request
    })
  }

  asResponse (response: AxiosResponse): Response {
    const r: Response = {}
    if (response.data) {
      r.data = response.data
    }
    if (response.headers) {
      r.headers = response.headers
    }
    if (response.status) {
      r.status = response.status
    }
    return r
  }

  asRequest (request: AxiosRequestConfig): Request {
    if (!request.url) throw new AsRequestError('No url is defined')
    if (!request.method) throw new AsRequestError('No method is defined')
    const r: Request = { url: request.url, method: request.method }
    if (request.data) {
      r.data = request.data
    }
    if (request.headers) {
      r.headers = request.headers
    }
    return r
  }

  init (auth: IAuthInternals<any, AxiosRequestConfig, AxiosResponse>) {
    if (!this.requestInterceptor) {
      this.requestInterceptor = this.axios.interceptors.request.use(async (config) => {
        const request = this.asRequest(config)

        const intercepted = await auth.interceptRequest(request)
        if (intercepted) {
          config.data = request.data
          config.headers = request.headers
        }
        return config
      })
    }

    if (!this.responseInterceptor) {
      this.responseInterceptor = this.axios.interceptors.response.use((response: AxiosResponse) => response, async (error: AxiosError) => {
        if (error.response) {
          const request = this.asRequest(error.config)
          const response = this.asResponse(error.response)

          const intercepted = await auth.interceptErrorResponse(request, response)
          if (intercepted) {
            error.config.baseURL = undefined // Workaround
            return this.axios.request(error.config)
          }
        }

        throw error
      })
    }
  }
}
