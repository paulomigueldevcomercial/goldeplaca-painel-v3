import { requestJson } from './apiClient'

export const listSumulas = ({ jogoId, time, competicaoId } = {}) =>
  requestJson('/api/sumulas', { params: { jogoId, time, competicaoId } })

export const createSumulas = (jogoId, time, payload) =>
  requestJson('/api/sumulas', {
    method: 'POST',
    params: { jogoId, time },
    body: payload,
  })

export const updateSumula = (id, payload) =>
  requestJson(`/api/sumulas/${id}`, { method: 'PUT', body: payload })

export const deleteSumula = (id) =>
  requestJson(`/api/sumulas/${id}`, { method: 'DELETE' })
