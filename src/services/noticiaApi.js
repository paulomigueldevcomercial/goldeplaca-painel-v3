import { API_BASE_URL, buildUrl, requestJson } from './apiClient'

const requestMultipart = async (path, { method = 'POST', noticia, file } = {}) => {
  const url = `${API_BASE_URL}${path}`
  const formData = new FormData()

  if (noticia) {
    Object.entries(noticia).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      formData.append(key, String(value))
    })
  }
  if (file) {
    formData.append('imagem', file)
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

export const listNoticias = ({ competicaoId } = {}) =>
  requestJson('/api/noticias', { params: { competicaoId } })

export const getNoticia = (id) => requestJson(`/api/noticias/${id}`)

export const createNoticia = (noticia, imageFile) =>
  requestMultipart('/api/noticias', {
    method: 'POST',
    noticia,
    file: imageFile,
  })

export const updateNoticia = (id, noticia, imageFile) =>
  requestMultipart(`/api/noticias/${id}`, {
    method: 'PUT',
    noticia,
    file: imageFile,
  })

export const deleteNoticia = (id) => requestJson(`/api/noticias/${id}`, { method: 'DELETE' })
