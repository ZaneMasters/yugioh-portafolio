import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as wishlistService from '../services/wishlistService'
import { queryKeys } from '../lib/queryKeys'

/**
 * Hook para operaciones CRUD de la wishlist privada.
 */
export function useWishlist(filters = {}) {
  const queryClient = useQueryClient()
  const enabled = filters !== null
  const safeFilters = filters ?? {}

  // ── Query ──────────────────────────────────────────────────────────────────
  const {
    data,
    isLoading: loading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: queryKeys.wishlist(safeFilters),
    queryFn: ({ pageParam }) => wishlistService.getWishlist({ ...safeFilters, cursor: pageParam }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : null,
    enabled,
  })

  const cards = data?.pages.flatMap(page => page.data) ?? []

  // ── Mutaciones ─────────────────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: (payload) => wishlistService.createWishlistCard(payload),
    onSuccess: (res) => {
      toast.success(res.message || 'Carta agregada a la wishlist')
      localStorage.setItem('portfolioLastUpdate', Date.now().toString())
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      queryClient.invalidateQueries({ queryKey: ['publicWishlist'] })
    },
    onError: (err) => toast.error(err.message || 'Error al agregar la carta'),
  })

  const editMutation = useMutation({
    mutationFn: ({ id, payload }) => wishlistService.updateWishlistCard(id, payload),
    onSuccess: (_, { id, payload }) => {
      queryClient.setQueriesData({ queryKey: ['wishlist'] }, (old) => {
        if (!old || !old.data) return old
        return { ...old, data: old.data.map((c) => (c.id === id ? { ...c, ...payload } : c)) }
      })
      localStorage.setItem('portfolioLastUpdate', Date.now().toString())
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      queryClient.invalidateQueries({ queryKey: ['publicWishlist'] })
      toast.success('Carta actualizada')
    },
    onError: (err) => toast.error(err.message || 'Error al actualizar'),
  })

  const removeMutation = useMutation({
    mutationFn: (id) => wishlistService.deleteWishlistCard(id),
    onSuccess: () => {
      toast.success('Carta eliminada de la wishlist')
      localStorage.setItem('portfolioLastUpdate', Date.now().toString())
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      queryClient.invalidateQueries({ queryKey: ['publicWishlist'] })
    },
    onError: (err) => toast.error(err.message || 'Error al eliminar'),
  })

  return {
    cards,
    loading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    actionLoading: addMutation.isPending || editMutation.isPending || removeMutation.isPending,
    addCard:    (payload)     => addMutation.mutateAsync(payload),
    editCard:   (id, payload) => editMutation.mutateAsync({ id, payload }),
    removeCard: (id)          => removeMutation.mutateAsync(id),
  }
}
