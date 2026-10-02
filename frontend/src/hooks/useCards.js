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
  const totalCount = data?.pages[0]?.totalCount ?? cards.length
  const totalQuantity = data?.pages[0]?.totalQuantity ?? cards.reduce((sum, c) => sum + (Number(c.quantity) || 1), 0)

  // ── Mutaciones ─────────────────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: (payload) => cardService.createCard(payload),
    onSuccess: (res) => {
      toast.success(res.message || 'Carta agregada al inventario', { duration: 5000 })
      localStorage.setItem('portfolioLastUpdate', Date.now().toString())
      queryClient.invalidateQueries({ queryKey: ['cards'] })
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-lookup'] })
    },
    onError: (err) => toast.error(err.message || 'Error al agregar la carta', { duration: 5000 }),
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
      queryClient.invalidateQueries({ queryKey: ['inventory-lookup'] })
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
      queryClient.invalidateQueries({ queryKey: ['inventory-lookup'] })
    },
    onError: (err) => toast.error(err.message || 'Error al eliminar'),
  })

  const syncPricesMutation = useMutation({
    mutationFn: (force = true) => cardService.syncCardPrices(force),
    onSuccess: (res) => {
      toast.success(res?.message || res?.data?.message || 'Precios de TCGPlayer actualizados')
      queryClient.invalidateQueries({ queryKey: ['cards'] })
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
    },
    onError: (err) => toast.error(err.message || 'Error al actualizar precios de TCGPlayer'),
  })

  const syncSingleCardMutation = useMutation({
    mutationFn: (id) => cardService.syncSingleCardPrice(id),
    onSuccess: (res) => {
      toast.success(res?.message || 'Precio TCGPlayer actualizado con éxito')
      queryClient.invalidateQueries({ queryKey: ['cards'] })
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-lookup'] })
    },
    onError: (err) => toast.error(err.message || 'Error al consultar TCGPlayer'),
  })

  return {
    cards,
    totalCount,
    totalQuantity,
    loading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    actionLoading: addMutation.isPending || editMutation.isPending || removeMutation.isPending,
    syncPricesLoading: syncPricesMutation.isPending,
    syncingCardId: syncSingleCardMutation.isPending ? syncSingleCardMutation.variables : null,
    addCard:             (payload)      => addMutation.mutateAsync(payload),
    editCard:            (id, payload)  => editMutation.mutateAsync({ id, payload }),
    removeCard:          (id)           => removeMutation.mutateAsync(id),
    syncPrices:          (force = true) => syncPricesMutation.mutateAsync(force),
    syncSingleCardPrice: (id)           => syncSingleCardMutation.mutateAsync(id),
  }
}
