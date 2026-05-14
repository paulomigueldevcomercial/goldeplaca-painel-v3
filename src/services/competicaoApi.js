import { requestJson } from './apiClient'

export const listCompeticoes = () => requestJson('/api/competicoes')

export const listCompeticoesFinalizadas = () => requestJson('/api/competicoes/finalizadas')

export const createCompeticao = (payload) =>
  requestJson('/api/competicoes', { method: 'POST', body: payload })

export const updateCompeticao = (id, payload) =>
  requestJson(`/api/competicoes/${id}`, { method: 'PUT', body: payload })

export const deleteCompeticao = (id) => requestJson(`/api/competicoes/${id}`, { method: 'DELETE' })
