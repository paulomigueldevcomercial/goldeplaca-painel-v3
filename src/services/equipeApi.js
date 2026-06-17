import { buildUrl, requestJson } from './apiClient'

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

const requestMultipart = async (path, { method = 'POST', equipe, logoFile, fotoFile } = {}) => {
  const url = new URL(buildUrl(path, equipe))
  const formData = new FormData()
  const token = getAuthToken()
  const headers = {}

  if (equipe && Object.prototype.hasOwnProperty.call(equipe, 'rebaixamento')) {
    url.searchParams.set('rebaixamento', equipe.rebaixamento ?? '')
  }

  if (logoFile) {
    formData.append('logo', logoFile)
  }
  if (fotoFile) {
    formData.append('foto', fotoFile)
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

export const listEquipes = (filters = {}) => requestJson('/api/equipes', { params: filters })

export const createEquipe = (payload, logoFile, fotoFile) =>
  requestMultipart('/api/equipes', { method: 'POST', equipe: payload, logoFile, fotoFile })

export const updateEquipe = (id, payload, logoFile, fotoFile) =>
  requestMultipart(`/api/equipes/${id}`, { method: 'PUT', equipe: payload, logoFile, fotoFile })

export const deleteEquipe = (id) => requestJson(`/api/equipes/${id}`, { method: 'DELETE' })
