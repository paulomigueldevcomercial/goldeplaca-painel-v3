import { buildUrl } from './apiClient'

export const downloadTabelaSemanaReport = async ({ competicao } = {}) => {
  const response = await fetch(buildUrl('/reports/tabela-semana', { competicao }), {
    method: 'GET',
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Não foi possível gerar o relatório da rodada da semana.')
  }

  return response.blob()
}
