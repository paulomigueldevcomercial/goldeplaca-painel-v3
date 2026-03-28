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

const requestMultipart = async (path, { method = 'POST', patrocinio, file } = {}) => {
  const url = `${API_BASE_URL}${path}`
  const formData = new FormData()
  const token = getAuthToken()
  const headers = {}

  if (patrocinio) {
    Object.entries(patrocinio).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      if (key === 'imagem' && file) return
      formData.append(key, String(value))
    })
  }

  if (file) {
    formData.append('arquivo', file)
  }

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

export const listPatrocinios = () => requestJson('/api/patrocinios')

export const getPatrocinio = (id) => requestJson(`/api/patrocinios/${id}`)

export const createPatrocinio = (patrocinio, imageFile) =>
  requestMultipart('/api/patrocinios', {
    method: 'POST',
    patrocinio,
    file: imageFile,
  })

export const updatePatrocinio = (id, patrocinio, imageFile) =>
  requestMultipart(`/api/patrocinios/${id}`, {
    method: 'PUT',
    patrocinio,
    file: imageFile,
  })

export const deletePatrocinio = (id) => requestJson(`/api/patrocinios/${id}`, { method: 'DELETE' })
