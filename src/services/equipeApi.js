import { API_BASE_URL, requestJson } from './apiClient'

const requestMultipart = async (path, { method = 'POST', equipe, logoFile, fotoFile } = {}) => {
  const url = `${API_BASE_URL}${path}`
  const formData = new FormData()

  if (equipe) {
    Object.entries(equipe).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      formData.append(key, String(value))
    })
  }
  if (logoFile) {
    formData.append('logo', logoFile)
  }
  if (fotoFile) {
    formData.append('foto', fotoFile)
  }

  const response = await fetch(url, {
    method,
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
