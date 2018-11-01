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
        if (!error.response) {
          throw error
        }

        const request = this.asRequest(error.config)
        const response = this.asResponse(error.response)

        const intercepted = await auth.interceptErrorResponse(request, response)
        if (intercepted) {
          error.config.baseURL = undefined // Workaround
          return this.axios.request(error.config)
        }

        throw error
      })
    }
  }
}
