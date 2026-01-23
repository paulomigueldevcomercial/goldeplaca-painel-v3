import { requestJson } from './apiClient'

export const listCategorias = () => requestJson('/api/categorias')

export const createCategoria = (payload) => requestJson('/api/categorias', { method: 'POST', body: payload })

export const updateCategoria = (categoriaAtual, payload) =>
  requestJson(`/api/categorias/${encodeURIComponent(categoriaAtual)}`, {
    method: 'PUT',
    body: payload,
  })

export const deleteCategoria = (categoria) =>
  requestJson(`/api/categorias/${encodeURIComponent(categoria)}`, { method: 'DELETE' })
