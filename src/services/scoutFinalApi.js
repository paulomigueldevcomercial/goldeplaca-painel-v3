import { requestJson } from './apiClient'

export const listScoutFinalCompeticoes = () => requestJson('/api/painel/scout-final/competicoes')

export const listScoutFinalCategorias = ({ competicao } = {}) =>
  requestJson('/api/painel/scout-final/categorias', { params: { competicao } })
