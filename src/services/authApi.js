import { requestJson } from './apiClient'

export const login = (payload) => requestJson('/api/auth/login', { method: 'POST', body: payload })

export const forgotPassword = (payload) =>
  requestJson('/api/auth/forgot-password', { method: 'POST', body: payload })
