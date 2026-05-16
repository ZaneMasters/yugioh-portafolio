import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import * as wishlistService from '../services/wishlistService'
import { useWishlistStore } from '../store/useWishlistStore'

export function useWishlist() {
  const { cards, setCards, setLoading, loading, updateCardLocally } = useWishlistStore()
  const [actionLoading, setActionLoading] = useState(false)

  const fetchCards = useCallback(async (filters = {}) => {
    setLoading(true)
    try {
      const res = await wishlistService.getWishlist(filters)
      setCards(res.data)
    } catch (err) {
      toast.error(err.message || 'Error al cargar la wishlist')
    } finally {
      setLoading(false)
    }
  }, [setCards, setLoading])

  const fetchPublicCards = useCallback(async (slug, filters = {}) => {
    setLoading(true)
    try {
      const res = await wishlistService.getPublicWishlist(slug, filters)
      setCards(res.data)
    } catch (err) {
      toast.error(err.message || 'Error al cargar la wishlist pública')
    } finally {
      setLoading(false)
    }
  }, [setCards, setLoading])

  const addCard = useCallback(async (payload) => {
    setActionLoading(true)
    try {
      const res = await wishlistService.createWishlistCard(payload)
      toast.success(res.message || 'Carta agregada a la wishlist')
      await fetchCards()
      return true
    } catch (err) {
      toast.error(err.message || 'Error al agregar la carta')
      return false
    } finally {
      setActionLoading(false)
    }
  }, [fetchCards])

  const editCard = useCallback(async (id, payload) => {
    setActionLoading(true)
    try {
      await wishlistService.updateWishlistCard(id, payload)
      updateCardLocally(id, payload)
      toast.success('Carta actualizada')
      return true
    } catch (err) {
      toast.error(err.message || 'Error al actualizar')
      return false
    } finally {
      setActionLoading(false)
    }
  }, [updateCardLocally])

  const removeCard = useCallback(async (id) => {
    setActionLoading(true)
    try {
      await wishlistService.deleteWishlistCard(id)
      toast.success('Carta eliminada de la wishlist')
      await fetchCards()
    } catch (err) {
      toast.error(err.message || 'Error al eliminar')
    } finally {
      setActionLoading(false)
    }
  }, [fetchCards])

  return { cards, loading, actionLoading, fetchCards, fetchPublicCards, addCard, editCard, removeCard }
}
