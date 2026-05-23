/**
 * Centralized TanStack Query keys.
 * Using factory functions so filters are included in the cache key,
 * allowing granular invalidation and automatic refetch when filters change.
 */
export const queryKeys = {
  // Admin: inventario privado
  cards: (filters = {}) => ['cards', filters],

  // Admin: wishlist privada
  wishlist: (filters = {}) => ['wishlist', filters],

  // Admin: colecciones del usuario autenticado
  folders: () => ['folders'],

  // Búsqueda externa (YGOProdeck)
  search: (query, lang = 'en') => ['search', query, lang],

  // Portafolio público
  portfolio: (slug, filters = {}) => ['portfolio', slug, filters],

  // Wishlist pública
  publicWishlist: (slug, filters = {}) => ['publicWishlist', slug, filters],

  // Colecciones públicas
  publicFolders: (slug) => ['publicFolders', slug],
}
