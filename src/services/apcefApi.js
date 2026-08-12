import { API_BASE_URL, buildUrl, requestJson } from './apiClient'

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

const parseErrorMessage = async (response) => {
  const text = await response.text()
  if (!text) return 'Falha ao processar a requisição.'

  try {
    const data = JSON.parse(text)
    return data.message || data.error || text
  } catch (error) {
    return text
  }
}

const requestMultipart = async (path, { method = 'POST', params, fields, files, file } = {}) => {
  const formData = new FormData()
  const token = getAuthToken()
  const headers = {}

  if (fields) {
    Object.entries(fields).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      formData.append(key, String(value))
    })
  }

  if (Array.isArray(files)) {
    files.forEach((item) => {
      if (item) formData.append('imagens', item)
    })
  }

  if (file) {
    formData.append('arquivo', file)
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(params ? buildUrl(path, params) : `${API_BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers,
    body: formData,
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  if (response.status === 204) return null

  const text = await response.text()
  return text ? JSON.parse(text) : null
}

export const listApcefCategorias = () => requestJson('/api/painel/apcef/noticias/categorias')

export const listApcefNoticias = ({ categoria } = {}) =>
  requestJson('/api/painel/apcef/noticias', { params: { categoria } })

export const createApcefNoticia = (noticia, imagens = []) =>
  requestMultipart('/api/painel/apcef/noticias', {
    method: 'POST',
    fields: noticia,
    files: imagens,
  })

export const updateApcefNoticia = (id, noticia, imagens = []) =>
  requestMultipart(`/api/painel/apcef/noticias/${id}`, {
    method: 'PUT',
    fields: noticia,
    files: imagens,
  })

export const deleteApcefNoticia = (id) =>
  requestJson(`/api/painel/apcef/noticias/${id}`, { method: 'DELETE' })

export const deleteApcefNoticiaImagem = (id) =>
  requestJson(`/api/painel/apcef/noticias/imagens/${id}`, { method: 'DELETE' })

export const listApcefEquipes = () => requestJson('/api/painel/apcef/arquivos/equipes')

export const uploadApcefImagemCompeticao = (file) =>
  requestMultipart('/api/painel/apcef/arquivos/imagem-competicao', { file })

export const uploadApcefLogoEquipe = (equipe, file) =>
  requestMultipart('/api/painel/apcef/arquivos/logos-equipes', {
    params: { equipe },
    file,
  })

export const uploadApcefFotoEquipe = (equipe, file) =>
  requestMultipart('/api/painel/apcef/arquivos/fotos-equipes', {
    params: { equipe },
    file,
  })

export const uploadApcefPdfRegulamento = (tipo, file) =>
  requestMultipart(`/api/painel/apcef/arquivos/pdfs/${tipo}`, { file })
