import { requestJson } from './apiClient'

export const listModalidades = () => requestJson('/api/modalidades')
