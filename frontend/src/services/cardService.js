import api from './api'
import publicApi from './publicApi'

/** Obtener todas las cartas del inventario con filtros opcionales */
export const getCards = (filters = {}) => {
  const params = {}
  if (filters.name) params.name = filters.name
  if (filters.type) params.type = filters.type
  if (filters.archetype) params.archetype = filters.archetype
  if (filters.folderId) params.folderId = filters.folderId
  return api.get('/cards', { params })
}

/**
 * Obtener el portafolio público de un usuario por su email-slug.
 * Ej: getPortfolioCards('angel') → GET /portfolio/angel/cards
 */
export const getPortfolioCards = (slug, filters = {}, cursor = null) => {
  const params = {}
  if (filters.name) params.name = filters.name
  if (filters.type) params.type = filters.type
  if (filters.archetype) params.archetype = filters.archetype
  if (filters.folderId) params.folderId = filters.folderId
  if (cursor) params.cursor = cursor
  return publicApi.get(`/cards/portfolio/${slug}/cards`, { params })
}

/** Obtener carta por ID de Firestore */
export const getCardById = (id) => api.get(`/cards/${id}`)

/** Registrar carta en inventario (name o cardId) */
export const createCard = (payload) => api.post('/cards', payload)

/** Actualizar quantity y/o condition */
export const updateCard = (id, payload) => api.put(`/cards/${id}`, payload)

/** Eliminar carta */
export const deleteCard = (id) => api.delete(`/cards/${id}`)
