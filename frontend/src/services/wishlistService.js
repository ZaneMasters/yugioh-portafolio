import api from './api'
import publicApi from './publicApi'

export const getWishlist = (filters = {}) => {
  const params = {}
  if (filters.name) params.name = filters.name
  if (filters.type) params.type = filters.type
  if (filters.archetype) params.archetype = filters.archetype
  return api.get('/wishlist', { params })
}

export const getPublicWishlist = (slug, filters = {}) => {
  const params = {}
  if (filters.name) params.name = filters.name
  if (filters.type) params.type = filters.type
  if (filters.archetype) params.archetype = filters.archetype
  // Ruta pública — no requiere Firebase token, usar publicApi para evitar el
  // delay de inicialización del SDK de Auth en la primera carga.
  return publicApi.get(`/wishlist/public/${slug}`, { params })
}

export const createWishlistCard = (payload) => api.post('/wishlist', payload)

export const updateWishlistCard = (id, payload) => api.put(`/wishlist/${id}`, payload)

export const deleteWishlistCard = (id) => api.delete(`/wishlist/${id}`)
