import { API_BASE_URL, buildUrl, requestJson } from './apiClient'

const buildNoticiaParams = (noticia) => ({
  noticia: JSON.stringify(noticia),
})

const requestMultipart = async (path, { method = 'POST', params, file } = {}) => {
  const url = params ? buildUrl(path, params) : `${API_BASE_URL}${path}`
  const formData = new FormData()
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
    params: buildNoticiaParams(noticia),
    file: imageFile,
  })

export const updateNoticia = (id, noticia, imageFile) =>
  requestMultipart(`/api/noticias/${id}`, {
    method: 'PUT',
    params: buildNoticiaParams(noticia),
    file: imageFile,
  })

export const deleteNoticia = (id) => requestJson(`/api/noticias/${id}`, { method: 'DELETE' })
