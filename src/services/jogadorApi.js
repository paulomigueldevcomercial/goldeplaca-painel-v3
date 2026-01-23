import { requestJson } from './apiClient'

export const listJogadores = (filters = {}) => requestJson('/api/jogadores', { params: filters })

export const createJogador = (payload) => requestJson('/api/jogadores', { method: 'POST', body: payload })

export const updateJogador = (id, payload) =>
  requestJson(`/api/jogadores/${id}`, { method: 'PUT', body: payload })

export const deleteJogador = (id) => requestJson(`/api/jogadores/${id}`, { method: 'DELETE' })
