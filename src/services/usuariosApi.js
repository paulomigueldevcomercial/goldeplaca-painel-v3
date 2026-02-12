import { requestJson } from './apiClient'

export const listUsuarios = () => requestJson('/api/usuarios')

export const getUsuario = (id) => requestJson(`/api/usuarios/${id}`)

export const createUsuario = (payload) =>
  requestJson('/api/usuarios', { method: 'POST', body: payload })

export const updateUsuario = (id, payload) =>
  requestJson(`/api/usuarios/${id}`, { method: 'PUT', body: payload })

export const deleteUsuario = (id) => requestJson(`/api/usuarios/${id}`, { method: 'DELETE' })
