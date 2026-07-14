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

const requestMultipart = async (
  path,
  { method = 'POST', competicao, fotoFile, imagemEmpresaFile } = {},
) => {
  const url = buildUrl(path, competicao)
  const formData = new FormData()
  const token = getAuthToken()
  const headers = {}

  if (fotoFile) {
    formData.append('foto', fotoFile)
  }
  if (imagemEmpresaFile) {
    formData.append('img_empresa', imagemEmpresaFile)
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

export const listCompeticoes = () => requestJson('/api/competicoes')

export const listCompeticoesFinalizadas = () => requestJson('/api/competicoes/finalizadas')

export const createCompeticao = (payload, fotoFile, imagemEmpresaFile) =>
  requestMultipart('/api/competicoes', {
    method: 'POST',
    competicao: payload,
    fotoFile,
    imagemEmpresaFile,
  })

export const updateCompeticao = (id, payload, fotoFile, imagemEmpresaFile) =>
  requestMultipart(`/api/competicoes/${id}`, {
    method: 'PUT',
    competicao: payload,
    fotoFile,
    imagemEmpresaFile,
  })

export const finishCompeticao = (id) =>
  requestJson(`/api/competicoes/${id}/finalizar`, { method: 'PATCH' })

export const activateCompeticao = (id) =>
  requestJson(`/api/competicoes/${id}/ativar`, { method: 'PATCH' })

export const deleteCompeticao = (id) => requestJson(`/api/competicoes/${id}`, { method: 'DELETE' })
