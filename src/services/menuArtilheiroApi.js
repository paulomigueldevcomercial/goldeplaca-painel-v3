import { requestJson } from './apiClient'

export const listMenuArtilheiro = () => requestJson('/api/menu-artilheiro')

export const getMenuArtilheiro = (id) => requestJson(`/api/menu-artilheiro/${id}`)

export const createMenuArtilheiro = (payload) =>
  requestJson('/api/menu-artilheiro', { method: 'POST', body: payload })

export const updateMenuArtilheiro = (id, payload) =>
  requestJson(`/api/menu-artilheiro/${id}`, { method: 'PUT', body: payload })

export const deleteMenuArtilheiro = (id) =>
  requestJson(`/api/menu-artilheiro/${id}`, { method: 'DELETE' })
