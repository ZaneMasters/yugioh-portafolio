import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as cardService from '../services/cardService'
import { queryKeys } from '../lib/queryKeys'

/**
 * Hook para operaciones CRUD del inventario.
 * Usa TanStack Query para caché automática e invalidación tras mutaciones.
 */
export function useCards(filters = {}) {
  const queryClient = useQueryClient()
  const enabled = filters !== null
  const safeFilters = filters ?? {}

  // ── Query ───────────────────────────────────────────────────────────────────────
  const {
    data,
    isLoading: loading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: queryKeys.cards(safeFilters),
    queryFn: ({ pageParam }) => cardService.getCards({ ...safeFilters, cursor: pageParam }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : null,
    enabled,
  })

  const cards = data?.pages.flatMap(page => page.data) ?? []

  // ── Mutaciones ─────────────────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: (payload) => cardService.createCard(payload),
    onSuccess: (res) => {
      toast.success(res.message || 'Carta agregada al inventario')
      localStorage.setItem('portfolioLastUpdate', Date.now().toString())
      queryClient.invalidateQueries({ queryKey: ['cards'] })
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
    },
    onError: (err) => toast.error(err.message || 'Error al agregar la carta'),
  })

  const editMutation = useMutation({
    mutationFn: ({ id, payload }) => cardService.updateCard(id, payload),
    onSuccess: (_, { id, payload }) => {
      // Optimistic update en caché
      queryClient.setQueriesData({ queryKey: ['cards'] }, (old) => {
        if (!old || !old.data) return old
        return { ...old, data: old.data.map((c) => (c.id === id ? { ...c, ...payload } : c)) }
      })
      localStorage.setItem('portfolioLastUpdate', Date.now().toString())
      queryClient.invalidateQueries({ queryKey: ['cards'] })
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
      toast.success('Carta actualizada')
    },
    onError: (err) => toast.error(err.message || 'Error al actualizar'),
  })

  const removeMutation = useMutation({
    mutationFn: (id) => cardService.deleteCard(id),
    onSuccess: () => {
      toast.success('Carta eliminada del inventario')
      localStorage.setItem('portfolioLastUpdate', Date.now().toString())
      queryClient.invalidateQueries({ queryKey: ['cards'] })
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
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
    addCard:    (payload)        => addMutation.mutateAsync(payload),
    editCard:   (id, payload)    => editMutation.mutateAsync({ id, payload }),
    removeCard: (id)             => removeMutation.mutateAsync(id),
  }
}
