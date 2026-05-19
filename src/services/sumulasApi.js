import { requestJson } from './apiClient'

export const getSumulaFormulario = (idJogo) => requestJson(`/api/sumulas/${idJogo}`)

export const listSumulas = ({ jogoId, time, competicaoId } = {}) =>
  requestJson('/api/sumulas', { params: { jogoId, time, competicaoId } })

export const createSumulas = (payload) =>
  requestJson('/api/sumulas', {
    method: 'POST',
    body: payload,
  })

export const updateSumula = (id, payload) =>
  requestJson(`/api/sumulas/${id}`, { method: 'PUT', body: payload })

export const deleteSumula = (id) => requestJson(`/api/sumulas/${id}`, { method: 'DELETE' })
