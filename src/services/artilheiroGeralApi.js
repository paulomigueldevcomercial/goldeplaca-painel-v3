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

const requestMultipart = async (path, { method = 'POST', artilheiro, imageFile } = {}) => {
  const url = `${API_BASE_URL}${path}`
  const formData = new FormData()
  const token = getAuthToken()
  const headers = {}

  if (artilheiro) {
    Object.entries(artilheiro).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      if (key === 'imagem' && imageFile) return
      formData.append(key, String(value))
    })
  }

  if (imageFile) {
    formData.append('imagem', imageFile)
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

export const listArtilheirosGerais = () => requestJson('/api/artilheiros-geral')

export const getArtilheiroGeral = (id) => requestJson(`/api/artilheiros-geral/${id}`)

export const createArtilheiroGeral = (payload, imageFile) =>
  requestMultipart('/api/artilheiros-geral', { method: 'POST', artilheiro: payload, imageFile })

export const updateArtilheiroGeral = (id, payload, imageFile) =>
  requestMultipart(`/api/artilheiros-geral/${id}`, {
    method: 'PUT',
    artilheiro: payload,
    imageFile,
  })

export const deleteArtilheiroGeral = (id) =>
  requestJson(`/api/artilheiros-geral/${id}`, { method: 'DELETE' })
