import { API_BASE_URL, buildUrl, requestJson } from './apiClient'

const handleResponse = async (response) => {
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Falha ao processar a requisição.')
  }

  if (response.status === 204) return null

  const text = await response.text()
  return text ? JSON.parse(text) : null
}

const sendNoticiaWithImage = async ({ path, method, noticia, imagem }) => {
  const url = buildUrl(path, {
    noticia: JSON.stringify(noticia),
  })

  const formData = new FormData()
  if (imagem) {
    formData.append('imagem', imagem)
  }

  const response = await fetch(url, {
    method,
    body: formData,
  })

  return handleResponse(response)
}

export const listNoticias = (competicaoId) =>
  requestJson('/api/noticias', { params: { competicaoId } })

export const createNoticia = (noticia, imagem) =>
  sendNoticiaWithImage({ path: '/api/noticias', method: 'POST', noticia, imagem })

export const updateNoticia = (id, noticia, imagem) =>
  sendNoticiaWithImage({ path: `/api/noticias/${id}`, method: 'PUT', noticia, imagem })

export const deleteNoticia = (id) =>
  fetch(`${API_BASE_URL}/api/noticias/${id}`, { method: 'DELETE' }).then(handleResponse)
