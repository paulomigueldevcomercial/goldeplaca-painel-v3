import { requestJson } from './apiClient'

export const listJogos = (filters = {}) => requestJson('/api/jogos', { params: filters })

export const createJogo = (payload) => requestJson('/api/jogos', { method: 'POST', body: payload })

export const updateJogo = (id, payload) => requestJson(`/api/jogos/${id}`, { method: 'PUT', body: payload })

export const deleteJogo = (id) => requestJson(`/api/jogos/${id}`, { method: 'DELETE' })
