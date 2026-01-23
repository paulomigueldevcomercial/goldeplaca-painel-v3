import { requestJson } from './apiClient'

export const listEquipes = (filters = {}) => requestJson('/api/equipes', { params: filters })

export const createEquipe = (payload) => requestJson('/api/equipes', { method: 'POST', body: payload })

export const updateEquipe = (id, payload) => requestJson(`/api/equipes/${id}`, { method: 'PUT', body: payload })

export const deleteEquipe = (id) => requestJson(`/api/equipes/${id}`, { method: 'DELETE' })
