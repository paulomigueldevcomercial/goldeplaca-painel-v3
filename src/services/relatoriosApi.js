import { buildUrl, requestJson } from './apiClient'

const getAuthToken = () => {
  if (typeof window === 'undefined') return ''

  try {
    const stored = window.localStorage.getItem('authSession')
    if (!stored) return ''
    return JSON.parse(stored)?.token ?? ''
  } catch (error) {
    return ''
  }
}

const fetchReportBlob = async (path, params, defaultErrorMessage) => {
  const token = getAuthToken()
  const headers = {}

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(buildUrl(path, params), {
    method: 'GET',
    credentials: 'include',
    headers,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || defaultErrorMessage)
  }

  return response.blob()
}

export const downloadTabelaSemanaReport = async ({ competicao } = {}) => {
  return fetchReportBlob(
    '/reports/tabela-semana',
    { competicao },
    'Não foi possível gerar o relatório da rodada da semana.',
  )
}

export const resolveJogoReportId = async ({ id, codigo } = {}) => {
  if (id !== undefined && id !== null && id !== '') {
    return Number(id)
  }

  if (codigo === undefined || codigo === null || codigo === '') {
    throw new Error('Informe o ID do jogo ou o código para gerar o relatório.')
  }

  const games = await requestJson('/api/jogos', {
    params: { codigo: Number(codigo) },
  })

  const normalizedGames = Array.isArray(games) ? games : []
  const game =
    normalizedGames.find((item) => String(item.codigo) === String(codigo)) ?? normalizedGames[0]

  if (!game) {
    throw new Error('Nenhum jogo encontrado para o código informado.')
  }

  if (game.id === undefined || game.id === null || game.id === '') {
    throw new Error('O jogo encontrado não retornou um ID válido para gerar o relatório.')
  }

  return Number(game.id)
}

export const downloadSumulaReport = async ({ id } = {}) =>
  fetchReportBlob('/reports/sumula', { id }, 'Não foi possível gerar o relatório de súmula.')

export const downloadSumulaFutsalReport = async ({ id } = {}) =>
  fetchReportBlob(
    '/reports/sumula-futsal',
    { id },
    'Não foi possível gerar o relatório de súmula futsal.',
  )
