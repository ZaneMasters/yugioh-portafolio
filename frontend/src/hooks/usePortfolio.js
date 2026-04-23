import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import * as cardService from '../services/cardService'

/**
 * Hook para cargar el portafolio público de un usuario por su slug.
 * Diseñado para ser usado en PortfolioPage.
 *
 * @param {string} slug - Prefijo del email (ej. 'angel')
 */
export function usePortfolio(slug) {
  const [cards, setCards]     = useState([])
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const fetchPortfolio = useCallback(async (filters = {}) => {
    if (!slug) return
    setLoading(true)
    setNotFound(false)
    try {
      const res = await cardService.getPortfolioCards(slug, filters)
      setCards(res.data ?? [])
    } catch (err) {
      if (err.message?.includes('404') || err.message?.toLowerCase().includes('no existe')) {
        setNotFound(true)
        setCards([])
      } else {
        toast.error(err.message || 'Error al cargar el portafolio')
      }
    } finally {
      setLoading(false)
    }
  }, [slug])

  return { cards, loading, notFound, fetchPortfolio }
}
