import { requestJson } from './apiClient'

export const listCompeticoesHistorico = () => requestJson('/api/competicoes-historico')
