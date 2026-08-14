import { buildUrl, throwResponseError } from './apiClient'

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

export const uploadEquipeReportLogo = async (time, file) => {
  const formData = new FormData()
  const token = getAuthToken()
  const headers = {}

  if (file) {
    formData.append('arquivo', file)
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(buildUrl('/api/painel/equipes/reports/logo', { time }), {
    method: 'POST',
    credentials: 'include',
    headers,
    body: formData,
  })

  if (!response.ok) {
    await throwResponseError(response)
  }

  if (response.status === 204) return null

  const text = await response.text()
  return text ? JSON.parse(text) : null
}
