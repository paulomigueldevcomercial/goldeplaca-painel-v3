import { getBackendBaseUrl } from '../config/runtimeConfig'
import { clearStoredSession, notifySessionExpired } from '../utils/authSession'

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

export const handleUnauthorizedResponse = (response) => {
  if (response.status !== 401 || typeof window === 'undefined') return

  clearStoredSession()
  notifySessionExpired()
}

export const parseErrorMessage = async (
  response,
  defaultMessage = 'Falha ao processar a requisição.',
) => {
  const text = await response.text()
  if (!text) return defaultMessage

  try {
    const data = JSON.parse(text)
    return data.message || data.error || text
  } catch (error) {
    return text
  }
}

export const throwResponseError = async (
  response,
  defaultMessage = 'Falha ao processar a requisição.',
) => {
  handleUnauthorizedResponse(response)

  const message = await parseErrorMessage(response, defaultMessage)
  const error = new Error(message || defaultMessage)
  error.status = response.status
  throw error
}

export const buildAuthHeaders = (headers = {}) => {
  const token = getAuthToken()
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers
}

export const requestJson = async (path, { method = 'GET', params, body } = {}) => {
  const url = params ? buildUrl(path, params) : `${API_BASE_URL}${path}`
  const headers = buildAuthHeaders(body !== undefined ? { 'Content-Type': 'application/json' } : {})

  const response = await fetch(url, {
    method,
    credentials: 'include',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    await throwResponseError(response)
  }

  if (response.status === 204) return null

  const text = await response.text()
  return text ? JSON.parse(text) : null
}
