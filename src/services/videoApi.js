import { requestJson } from './apiClient'

export const listVideos = ({ competicaoId, ativo } = {}) =>
  requestJson('/api/videos', { params: { competicaoId, ativo } })

export const getVideo = (id) => requestJson(`/api/videos/${id}`)

export const createVideo = (video) =>
  requestJson('/api/videos', {
    method: 'POST',
    body: video,
  })

export const updateVideo = (id, video) =>
  requestJson(`/api/videos/${id}`, {
    method: 'PUT',
    body: video,
  })

export const deleteVideo = (id) => requestJson(`/api/videos/${id}`, { method: 'DELETE' })
