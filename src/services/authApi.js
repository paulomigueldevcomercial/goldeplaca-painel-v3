import { requestJson } from './apiClient'

export const login = (payload) => requestJson('/api/auth/login', { method: 'POST', body: payload })

export const getSession = () => requestJson('/api/auth/session')

export const logout = () => requestJson('/api/auth/logout', { method: 'POST' })

export const forgotPassword = (payload) =>
  requestJson('/api/auth/forgot-password', { method: 'POST', body: payload })
