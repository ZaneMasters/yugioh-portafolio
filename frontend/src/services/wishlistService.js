import api from './api'
import publicApi from './publicApi'

export const getWishlist = (filters = {}) => {
  const params = {}
  if (filters.name) params.name = filters.name
  if (filters.type) params.type = filters.type
  if (filters.archetype) params.archetype = filters.archetype
  if (filters.cursor) params.cursor = filters.cursor
  if (filters.limit) params.limit = filters.limit
  return api.get('/wishlist', { params })
}

export const getPublicWishlist = (slug, filters = {}, cursor = null) => {
  const params = {}
  if (filters.name) params.name = filters.name
  if (filters.type) params.type = filters.type
  if (filters.archetype) params.archetype = filters.archetype
  if (filters.t) params.t = filters.t
  if (cursor) params.cursor = cursor
  return publicApi.get(`/wishlist/public/${slug}`, { params })
}

export const createWishlistCard = (payload) => api.post('/wishlist', payload)

export const updateWishlistCard = (id, payload) => api.put(`/wishlist/${id}`, payload)

export const deleteWishlistCard = (id) => api.delete(`/wishlist/${id}`)
