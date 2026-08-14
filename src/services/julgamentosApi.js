import { buildUrl, requestJson, throwResponseError } from './apiClient'

export const listJulgamentos = ({ competicaoId, convocado } = {}) =>
  requestJson('/api/julgamentos', { params: { competicaoId, convocado } })

export const getJulgamento = (id) => requestJson(`/api/julgamentos/${id}`)

export const createJulgamento = (payload) =>
  requestJson('/api/julgamentos', { method: 'POST', body: payload })

export const updateJulgamento = (id, payload) =>
  requestJson(`/api/julgamentos/${id}`, { method: 'PUT', body: payload })

export const deleteJulgamento = (id) => requestJson(`/api/julgamentos/${id}`, { method: 'DELETE' })

export const downloadJulgamentoReport = async ({ numeroProcesso } = {}) => {
  const response = await fetch(
    buildUrl('/reports/julgamento', { numero_processo: numeroProcesso }),
    {
      method: 'GET',
      credentials: 'include',
    },
  )

  if (!response.ok) {
    await throwResponseError(response, 'Não foi possível gerar o relatório de julgamento.')
  }

  return response.blob()
}
