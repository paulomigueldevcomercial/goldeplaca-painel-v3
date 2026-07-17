import { requestJson } from './apiClient'

export const listCompeticoesHistorico = () => requestJson('/api/competicoes-historico')

export const getCompeticaoHistorico = (id) => requestJson(`/api/competicoes-historico/${id}`)

export const createCompeticaoHistorico = (payload) =>
  requestJson('/api/competicoes-historico', { method: 'POST', body: payload })

export const updateCompeticaoHistorico = (id, payload) =>
  requestJson(`/api/competicoes-historico/${id}`, { method: 'PUT', body: payload })

export const deleteCompeticaoHistorico = (id) =>
  requestJson(`/api/competicoes-historico/${id}`, { method: 'DELETE' })
