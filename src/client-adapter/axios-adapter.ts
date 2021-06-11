import {
  ClientAdapter,
  Request,
  RequestInterceptor,
  Response,
  ResponseInterceptor
} from '../auth-toolbox'
import { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

/**
 * Wraps instance of Axios client into a {@link ClientAdapter} to support automated authentication.
 *
 * It should be given to {@link Auth} constructor.
 */
export class AxiosAdapter implements ClientAdapter<AxiosResponse> {
  private readonly axios: AxiosInstance
  private readonly config: AxiosRequestConfig

  constructor (axios: AxiosInstance, config: AxiosRequestConfig = {}) {
    this.axios = axios
    this.config = config
  }

  async login (request: Request): Promise<AxiosResponse> {
    return await this.axios.request({
      ...this.config,
      ...request
    })
  }

  async logout (request: Request): Promise<AxiosResponse> {
    return await this.axios.request({
      ...this.config,
      ...request
    })
  }

  async renew (request: Request): Promise<AxiosResponse> {
    return await this.axios.request({
      ...this.config,
      ...request
    })
  }

  async request (request: Request): Promise<AxiosResponse> {
    return await this.axios.request({
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
    const url = request.url
    const method = request.method
    if (!url) throw new Error('No url is defined')
    if (!method) throw new Error('No method is defined')
    const r: Request = { url, method: method }
    if (request.data) {
      r.data = request.data
    }
    if (request.headers) {
      r.headers = request.headers
    }
    return r
  }

  setupRequestInterceptor (interceptor: RequestInterceptor): () => void {
    const id = this.axios.interceptors.request.use(async config => {
      const request = this.asRequest(config)

      const intercepted = await interceptor.interceptRequest(request)
      if (intercepted) {
        config.data = request.data
        config.headers = request.headers
      }
      return config
    })
    return () => this.axios.interceptors.request.eject(id)
  }

  setupErrorResponseInterceptor (interceptor: ResponseInterceptor): () => void {
    const id = this.axios.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        if (error.response != null) {
          const request = this.asRequest(error.config)
          const response = this.asResponse(error.response)

          const intercepted = await interceptor.interceptResponse(request, response)
          if (intercepted) {
            delete error.config.baseURL // Workaround
            return await this.axios.request(error.config)
          }
        }

        throw error
      }
    )
    return () => this.axios.interceptors.response.eject(id)
  }
}
