import { useInfiniteQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as cardService from '../services/cardService'
import * as wishlistService from '../services/wishlistService'
import { queryKeys } from '../lib/queryKeys'

/**
 * Hook para cargar el portafolio público de un usuario por su slug.
 * Usa useInfiniteQuery para cursor-based pagination.
 *
 * @param {string} slug        - Prefijo del email (ej. 'angel')
 * @param {string} tab         - 'inventory' | 'wishlist'
 * @param {object} filters     - Filtros de búsqueda
 */
export function usePortfolio(slug, tab = 'inventory', filters = {}) {
  const isInventory = tab === 'inventory'
  const queryKey = isInventory
    ? queryKeys.portfolio(slug, filters)
    : queryKeys.publicWishlist(slug, filters)

  const fetchFn = ({ pageParam = null }) =>
    isInventory
      ? cardService.getPortfolioCards(slug, filters, pageParam)
      : wishlistService.getPublicWishlist(slug, filters, pageParam)

  const {
    data,
    isLoading:  loading,
    isFetchingNextPage: loadingMore,
    fetchNextPage,
    hasNextPage: hasMore,
    error,
  } = useInfiniteQuery({
    queryKey,
    queryFn: fetchFn,
    enabled: !!slug,
    staleTime: 2 * 60 * 1000, // 2 minutos para portafolios públicos
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
    }),
    retry: 1,
    meta: {
      onError: (err) => {
        if (err.message?.includes('404') || err.message?.toLowerCase().includes('no existe')) {
          // Manejado via error state
        } else {
          toast.error(err.message || 'Error al cargar el portafolio')
        }
      },
    },
  })

  // Aplanar todas las páginas en un solo array
  const cards = data?.pages.flatMap((page) => page.data ?? []) ?? []
  const totalCount = data?.pages[0]?.totalCount ?? cards.length
  const notFound = !!error && (
    error.message?.includes('404') ||
    error.message?.toLowerCase().includes('no existe')
  )

  return {
    cards,
    loading,
    loadingMore,
    notFound,
    hasMore: !!hasMore,
    totalCount,
    fetchNextPage,
  }
}
