import api from './api'
import publicApi from './publicApi'

/** Obtener todas las cartas del inventario con filtros opcionales */
export const getCards = (filters = {}) => {
  const params = {}
  if (filters.name) params.name = filters.name
  if (filters.type) params.type = filters.type
  if (filters.archetype) params.archetype = filters.archetype
  return api.get('/cards', { params })
}

/**
 * Obtener el portafolio público de un usuario por su email-slug.
 * Ej: getPortfolioCards('angel') → GET /portfolio/angel/cards
 */
export const getPortfolioCards = (slug, filters = {}) => {
  const params = {}
  if (filters.name) params.name = filters.name
  if (filters.type) params.type = filters.type
  if (filters.archetype) params.archetype = filters.archetype
  // Ruta pública — no requiere Firebase token, usar publicApi para evitar el
  // delay de inicialización del SDK de Auth en la primera carga.
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
