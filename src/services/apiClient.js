import { getBackendBaseUrl } from '../config/runtimeConfig'

export const API_BASE_URL = getBackendBaseUrl()

const getAuthToken = () => {
  if (typeof window === 'undefined') return ''

  try {
    const stored = window.localStorage.getItem('authSession')
    if (!stored) return ''
    return JSON.parse(stored)?.token ?? ''
  } catch (error) {
    return ''
  }
}

export const buildUrl = (path, params) => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
  const url = new URL(`${API_BASE_URL}${path}`, baseUrl)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      url.searchParams.append(key, value)
    })
  }

  return url.toString()
}

export const requestJson = async (path, { method = 'GET', params, body } = {}) => {
  const url = params ? buildUrl(path, params) : `${API_BASE_URL}${path}`
  const token = getAuthToken()
  const headers = {}

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, {
    method,
    credentials: 'include',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      window.localStorage.removeItem('authSession')
    }

    const text = await response.text()
    let message = text

    if (text) {
      try {
        const data = JSON.parse(text)
        message = data.message || data.error || text
      } catch (error) {
        message = text
      }
    }

    const error = new Error(message || 'Falha ao processar a requisição.')
    error.status = response.status
    throw error
  }

  if (response.status === 204) return null

  const text = await response.text()
  return text ? JSON.parse(text) : null
}
