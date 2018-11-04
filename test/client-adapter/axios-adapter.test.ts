import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import AxiosAdapter from '../../src/client-adapter/axios-adapter'
import Auth, { Request, RequestInterceptor, ResponseInterceptor } from '../../src/auth-toolbox'
import MockAdapter from 'axios-mock-adapter'
import { AsRequestError } from '../../src/client-adapter'
import createMockInstance from 'jest-create-mock-instance'


describe('AxiosAdapter', () => {
  it('perform login request', async () => {
    const axiosInstance = axios.create()
    const requestSpy = jest.spyOn(axiosInstance, 'request')

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onPost('login').reply(200)

    const axiosAdapter = new AxiosAdapter(axiosInstance)
    const request: Request = { method: 'POST', url: 'login' }
    const response = await axiosAdapter.login(request)

    expect(requestSpy).toHaveBeenCalledTimes(1)
    expect(requestSpy).toHaveBeenLastCalledWith({ method: 'POST', url: 'login' })

    return response
  })

  it('perform login request with config', async () => {
    const axiosInstance = axios.create()
    const requestSpy = jest.spyOn(axiosInstance, 'request')

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onPost('login').reply(200)

    const username = 'testUsername'
    const password = 'testPassword'
    const auth = { username, password }

    const axiosAdapter = new AxiosAdapter(axiosInstance, { auth })
    const request: Request = { method: 'POST', url: 'login' }
    const response = await axiosAdapter.login(request)

    expect(requestSpy).toHaveBeenCalledTimes(1)
    expect(requestSpy).toHaveBeenLastCalledWith({ method: 'POST', url: 'login', auth })

    return response
  })

  it('perform login request', async () => {
    const axiosInstance = axios.create()
    const requestSpy = jest.spyOn(axiosInstance, 'request')

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onPost('logout').reply(200)

    const axiosAdapter = new AxiosAdapter(axiosInstance)
    const request: Request = { method: 'POST', url: 'logout' }
    const response = await axiosAdapter.logout(request)

    expect(requestSpy).toHaveBeenCalledTimes(1)
    expect(requestSpy).toHaveBeenLastCalledWith({ method: 'POST', url: 'logout' })

    return response
  })

  it('perform logout request with config', async () => {
    const axiosInstance = axios.create()
    const requestSpy = jest.spyOn(axiosInstance, 'request')

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onPost('logout').reply(200)

    const username = 'testUsername'
    const password = 'testPassword'
    const auth = { username, password }

    const axiosAdapter = new AxiosAdapter(axiosInstance, { auth })
    const request: Request = { method: 'POST', url: 'logout' }
    const response = axiosAdapter.logout(request)

    expect(requestSpy).toHaveBeenCalledTimes(1)
    expect(requestSpy).toHaveBeenLastCalledWith({ method: 'POST', url: 'logout', auth })

    return response
  })

  it('perform renew request', async () => {
    const axiosInstance = axios.create()
    const requestSpy = jest.spyOn(axiosInstance, 'request')

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onPost('renew').reply(200)

    const axiosAdapter = new AxiosAdapter(axiosInstance)
    const request: Request = { method: 'POST', url: 'renew' }
    const response = await axiosAdapter.renew(request)

    expect(requestSpy).toHaveBeenCalledTimes(1)
    expect(requestSpy).toHaveBeenLastCalledWith({ method: 'POST', url: 'renew' })

    return response
  })

  it('perform renew request with config', async () => {
    const axiosInstance = axios.create()
    const requestSpy = jest.spyOn(axiosInstance, 'request')

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onPost('renew').reply(200)

    const username = 'testUsername'
    const password = 'testPassword'
    const auth = { username, password }

    const axiosAdapter = new AxiosAdapter(axiosInstance, { auth })
    const request: Request = { method: 'POST', url: 'renew' }
    const response = await axiosAdapter.renew(request)

    expect(requestSpy).toHaveBeenCalledTimes(1)
    expect(requestSpy).toHaveBeenLastCalledWith({ method: 'POST', url: 'renew', auth })

    return response
  })

  it('perform request', async () => {
    const axiosInstance = axios.create()
    const requestSpy = jest.spyOn(axiosInstance, 'request')

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onPost('custom').reply(200)

    const axiosAdapter = new AxiosAdapter(axiosInstance)
    const request: Request = { method: 'POST', url: 'custom' }
    const response = await axiosAdapter.request(request)

    expect(requestSpy).toHaveBeenCalledTimes(1)
    expect(requestSpy).toHaveBeenLastCalledWith({ method: 'POST', url: 'custom' })

    return response
  })

  it('perform request with config', async () => {
    const axiosInstance = axios.create()
    const requestSpy = jest.spyOn(axiosInstance, 'request')

    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onPost('custom').reply(200)

    const username = 'testUsername'
    const password = 'testPassword'
    const auth = { username, password }

    const axiosAdapter = new AxiosAdapter(axiosInstance, { auth })
    const request: Request = { method: 'POST', url: 'custom' }
    const response = await axiosAdapter.request(request)

    expect(requestSpy).toHaveBeenCalledTimes(1)
    expect(requestSpy).toHaveBeenLastCalledWith({ method: 'POST', url: 'custom' })

    return response
  })

  it('converts to response', () => {
    const axiosInstance = axios.create()

    const axiosAdapter = new AxiosAdapter(axiosInstance)
    const axiosResponse: AxiosResponse = {
      config: {},
      data: 'testData',
      status: 200,
      statusText: 'OK',
      headers: { testHeader: 'testHeaderValue' }

    }
    const response = axiosAdapter.asResponse(axiosResponse)
    expect(response).toEqual({ data: axiosResponse.data, status: axiosResponse.status, headers: axiosResponse.headers })
  })

  it('converts to request', () => {
    const axiosInstance = axios.create()

    const axiosAdapter = new AxiosAdapter(axiosInstance)
    const axiosRequest: AxiosRequestConfig = {
      url: 'testUrl',
      method: 'GET',
      data: 'testData',
      headers: { testHeader: 'testHeaderValue' }
    }
    const response = axiosAdapter.asRequest(axiosRequest)
    expect(response).toEqual({
      url: axiosRequest.url,
      data: axiosRequest.data,
      method: axiosRequest.method,
      headers: axiosRequest.headers
    })
  })

  it('fails to convert to request if url is not defined', () => {
    const axiosInstance = axios.create()

    const axiosAdapter = new AxiosAdapter(axiosInstance)
    const axiosRequest: AxiosRequestConfig = {
      method: 'GET',
      data: 'testData',
      headers: { testHeader: 'testHeaderValue' }
    }
    expect(() => axiosAdapter.asRequest(axiosRequest)).toThrowError(AsRequestError)
  })

  it('fails to convert to request if method is not defined', () => {
    const axiosInstance = axios.create()

    const axiosAdapter = new AxiosAdapter(axiosInstance)
    const axiosRequest: AxiosRequestConfig = {
      url: 'testUrl',
      data: 'testData',
      headers: { testHeader: 'testHeaderValue' }
    }
    expect(() => axiosAdapter.asRequest(axiosRequest)).toThrowError(AsRequestError)
  })

  it('intercept login requests', async () => {
    const axiosInstance = axios.create()

    const axiosAdapter = new AxiosAdapter(axiosInstance)
    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onGet('testUrl').reply(200)

    const interceptRequestMock = jest.fn((request: Request) => {
      request.data = 'interceptedData'
      request.headers = { interceptedHeader: 'interceptedHeaderValue' }
      return true
    })

    const authMock: RequestInterceptor = createMockInstance(Auth)
    authMock.interceptRequest = interceptRequestMock
    axiosAdapter.setupRequestInterceptor(authMock)

    const response = await axiosAdapter.request({ method: 'GET', url: 'testUrl' })

    expect(authMock.interceptRequest).toHaveBeenLastCalledWith({
      method: 'get',
      url: 'testUrl',
      data: 'interceptedData',
      headers: { interceptedHeader: 'interceptedHeaderValue' }
    })

    return response
  })

  it('intercept login responses', async () => {
    const axiosInstance = axios.create()

    const axiosAdapter = new AxiosAdapter(axiosInstance)
    const axiosMock: MockAdapter = new MockAdapter(axiosInstance)
    axiosMock.onGet('testUrl').reply(401)

    let called = false

    const interceptErrorResponse = jest.fn((request: Request, response: Response) => {
      if (!called) {
        called = true
        return true
      }
      return false
    })

    const authMock: ResponseInterceptor = createMockInstance(Auth)
    authMock.interceptResponse = interceptErrorResponse
    axiosAdapter.setupErrorResponseInterceptor(authMock)

    try {
      await axiosAdapter.request({ method: 'GET', url: 'testUrl' })
    } catch (e) {
      expect(() => {
        throw e
      }).toThrow()
    }

    expect(authMock.interceptResponse).toHaveBeenCalledTimes(2)
    expect(authMock.interceptResponse).toHaveBeenLastCalledWith({
      method: 'get',
      url: 'testUrl',
      headers: { 'Accept': 'application/json, text/plain, */*' }
    }, {
      status: 401
    })

    return null
  })
})
