import { useEffect } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as cardService from '../services/cardService'
import * as wishlistService from '../services/wishlistService'
import { queryKeys } from '../lib/queryKeys'

/**
 * Hook para cargar el portafolio público de un usuario por su slug.
 * Usa useInfiniteQuery para cursor-based pagination.
 * Sincroniza en tiempo real: polling automático cada 12 segundos y al re-enfocar la ventana.
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
    isLoading: loading,
    isFetchingNextPage: loadingMore,
    fetchNextPage,
    hasNextPage: hasMore,
    error,
  } = useInfiniteQuery({
    queryKey,
    queryFn: fetchFn,
    enabled: !!slug,
    staleTime: 60 * 1000, // 1 minuto de frescura en cliente
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
