import { useEffect } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as cardService from '../services/cardService'
import * as wishlistService from '../services/wishlistService'
import { queryKeys } from '../lib/queryKeys'
import { useAuth } from '../context/AuthContext'

/**
 * Hook para cargar el portafolio público de un usuario por su slug.
 * Usa useInfiniteQuery para cursor-based pagination.
 *
 * @param {string} slug        - Prefijo del email (ej. 'angel')
 * @param {string} tab         - 'inventory' | 'wishlist'
 * @param {object} filters     - Filtros de búsqueda
 */
export function usePortfolio(slug, tab = 'inventory', filters = {}) {
  const { user, profile } = useAuth()
  const isOwner = Boolean(
    slug && (
      (profile?.slug && profile.slug.toLowerCase() === slug.toLowerCase()) ||
      (user?.email && user.email.split('@')[0].toLowerCase() === slug.toLowerCase())
    )
  )

  const activeFilters = { ...filters }
  if (isOwner) {
    const lastUpdate = localStorage.getItem('portfolioLastUpdate')
    if (lastUpdate) {
      activeFilters.t = lastUpdate
    }
  }

  const isInventory = tab === 'inventory'
  const queryKey = isInventory
    ? queryKeys.portfolio(slug, activeFilters)
    : queryKeys.publicWishlist(slug, activeFilters)

  const fetchFn = ({ pageParam = null }) =>
    isInventory
      ? cardService.getPortfolioCards(slug, activeFilters, pageParam)
      : wishlistService.getPublicWishlist(slug, activeFilters, pageParam)

  const {
    data,
    isLoading: loading,
    isFetchingNextPage: loadingMore,
    fetchNextPage,
    hasNextPage: hasMore,
    error,
  } = useInfiniteQuery({
    queryKey,
    queryFn: fetchFn,
    enabled: !!slug,
    staleTime: isOwner ? 0 : 5 * 60 * 1000, // 5 minutos para visitantes, instantáneo para el dueño
    refetchOnWindowFocus: false, // Evita spam continuo al alternar de ventana
    refetchOnReconnect: true,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
    }),
    retry: 1,
  })

  // Toast en caso de error
  useEffect(() => {
    if (!error) return
    const is404 =
      error.message?.includes('404') ||
      error.message?.toLowerCase().includes('no existe')
    if (!is404) {
      toast.error(error.message || 'Error al cargar el portafolio')
    }
  }, [error])

  // Aplanar todas las páginas en un solo array
  const cards = data?.pages.flatMap((page) => page.data ?? []) ?? []
  const totalCount = data?.pages[0]?.totalCount ?? cards.length
  const totalQuantity = data?.pages[0]?.totalQuantity ?? cards.reduce((acc, c) => acc + (Number(c.quantity) || 1), 0)
  const whatsapp = data?.pages[0]?.whatsapp ?? null
  const notFound = !!error && (
    error.message?.includes('404') ||
    error.message?.toLowerCase().includes('no existe')
  )

  return {
    cards,
    whatsapp,
    loading,
    loadingMore,
    notFound,
    hasMore: !!hasMore,
    totalCount,
    totalQuantity,
    fetchNextPage,
  }
}
