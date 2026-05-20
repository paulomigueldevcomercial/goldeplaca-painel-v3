import { buildUrl } from './apiClient'

const endpointsByType = {
  rgc: '/api/painel/competicoes/pdf/rgc',
  cde: '/api/painel/competicoes/pdf/cde',
  resultado: '/api/painel/competicoes/pdf/resultado',
  outrosAnexos: '/api/painel/competicoes/pdf/outros-anexos',
}

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

export const uploadCompeticaoPdf = async (type, competicaoId, file) => {
  const endpoint = endpointsByType[type]

  if (!endpoint) {
    throw new Error('Tipo de PDF inválido.')
  }

  const formData = new FormData()
  const token = getAuthToken()
  const headers = {}

  if (file) {
    formData.append('arquivo', file)
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(buildUrl(endpoint, { competicaoId }), {
    method: 'POST',
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
