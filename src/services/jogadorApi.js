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

const requestMultipart = async (
  path,
  { method = 'POST', jogador, imgFile, imgPerfilFile } = {},
) => {
  const url = `${API_BASE_URL}${path}`
  const formData = new FormData()
  const token = getAuthToken()
  const headers = {}

  if (jogador) {
    Object.entries(jogador).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      formData.append(key, String(value))
    })
  }
  if (imgFile) {
    formData.append('img', imgFile)
  }
  if (imgPerfilFile) {
    formData.append('img_perfil', imgPerfilFile)
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

export const listJogadores = (filters = {}) => requestJson('/api/jogadores', { params: filters })

export const createJogador = (payload, imgFile, imgPerfilFile) =>
  requestMultipart('/api/jogadores', {
    method: 'POST',
    jogador: payload,
    imgFile,
    imgPerfilFile,
  })

export const updateJogador = (id, payload, imgFile, imgPerfilFile) =>
  requestMultipart(`/api/jogadores/${id}`, {
    method: 'PUT',
    jogador: payload,
    imgFile,
    imgPerfilFile,
  })

export const deleteJogador = (id) => requestJson(`/api/jogadores/${id}`, { method: 'DELETE' })
