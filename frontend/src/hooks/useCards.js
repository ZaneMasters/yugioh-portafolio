import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import * as cardService from '../services/cardService'
import { useInventoryStore } from '../store/useInventoryStore'

/**
 * Hook para operaciones CRUD del inventario.
 * Lee del store Zustand y dispara los side-effects con el servicio.
 */
export function useCards() {
  const { cards, setCards, setLoading, loading } = useInventoryStore()
  const [actionLoading, setActionLoading] = useState(false)

  /** Cargar todas las cartas con filtros opcionales */
  const fetchCards = useCallback(async (filters = {}) => {
    setLoading(true)
    try {
      const res = await cardService.getCards(filters)
      setCards(res.data)
    } catch (err) {
      toast.error(err.message || 'Error al cargar el inventario')
    } finally {
      setLoading(false)
    }
  }, [setCards, setLoading])

  /** Agregar carta al inventario */
  const addCard = useCallback(async (payload) => {
    setActionLoading(true)
    try {
      const res = await cardService.createCard(payload)
      toast.success(res.message || 'Carta agregada al inventario')
      await fetchCards()
      return true
    } catch (err) {
      toast.error(err.message || 'Error al agregar la carta')
      return false
    } finally {
      setActionLoading(false)
    }
  }, [fetchCards])

  /** Actualizar quantity o condition de una carta */
  const editCard = useCallback(async (id, payload) => {
    setActionLoading(true)
    try {
      await cardService.updateCard(id, payload)
      toast.success('Carta actualizada')
      await fetchCards()
      return true
    } catch (err) {
      toast.error(err.message || 'Error al actualizar')
      return false
    } finally {
      setActionLoading(false)
    }
  }, [fetchCards])

  /** Eliminar carta */
  const removeCard = useCallback(async (id) => {
    setActionLoading(true)
    try {
      await cardService.deleteCard(id)
      toast.success('Carta eliminada del inventario')
      await fetchCards()
    } catch (err) {
      toast.error(err.message || 'Error al eliminar')
    } finally {
      setActionLoading(false)
    }
  }, [fetchCards])

  return { cards, loading, actionLoading, fetchCards, addCard, editCard, removeCard }
}
