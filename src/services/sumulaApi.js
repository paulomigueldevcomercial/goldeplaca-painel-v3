import { API_BASE_URL, buildUrl } from './apiClient'

export const uploadSumula = async (codigo, pdfFile) => {
  const url = buildUrl('/api/painel/sumulas/upload', { codigo })
  const formData = new FormData()

  if (pdfFile) {
    formData.append('pdf', pdfFile)
  }

  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
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
