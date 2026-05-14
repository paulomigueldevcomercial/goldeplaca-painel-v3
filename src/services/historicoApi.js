import { API_BASE_URL, requestJson } from './apiClient'

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

const requestMultipart = async (path, { method = 'POST', historico, files = {} } = {}) => {
  const url = `${API_BASE_URL}${path}`
  const formData = new FormData()
  const token = getAuthToken()
  const headers = {}

  if (historico) {
    Object.entries(historico).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      formData.append(key, String(value))
    })
  }

  Object.entries(files).forEach(([field, file]) => {
    if (file) {
      formData.append(field, file)
    }
  })

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, {
    method,
    credentials: 'include',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Falha ao processar a requisição.')
  }

  if (response.status === 204) return null

  const text = await response.text()
  return text ? JSON.parse(text) : null
}

export const listHistoricos = () => requestJson('/api/historicos')

export const getHistorico = (id) => requestJson(`/api/historicos/${id}`)

export const createHistorico = (payload, files) =>
  requestMultipart('/api/historicos', { method: 'POST', historico: payload, files })

export const updateHistorico = (id, payload, files) =>
  requestMultipart(`/api/historicos/${id}`, { method: 'PUT', historico: payload, files })

export const deleteHistorico = (id) => requestJson(`/api/historicos/${id}`, { method: 'DELETE' })
