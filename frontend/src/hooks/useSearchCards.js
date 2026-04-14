import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { searchExternalCards } from '../services/externalService'
import { getCachedSearch, setCachedSearch } from '../utils/searchCache'

/**
 * Hook para buscar cartas en la API externa de YGOProdeck.
 * Implementa caché de dos niveles (memoria + sessionStorage) para minimizar
 * las llamadas al backend y a la API externa de YGOProdeck.
 *
 * Flujo de una búsqueda:
 *  1. Revisar caché de memoria (Map) → respuesta instantánea
 *  2. Revisar sessionStorage con TTL → respuesta sin red
 *  3. Si no hay caché → llamar al backend → guardar en caché
 */
export function useSearchCards() {
  const [results, setResults]   = useState([])
  const [searching, setSearching] = useState(false)

  const search = useCallback(async (name) => {
    if (!name || name.trim().length < 2) {
      setResults([])
      return
    }

    const normalized = name.trim()

    // ── 1. Intentar caché ──────────────────────────────────────────────────────
    const cached = getCachedSearch(normalized)
    if (cached) {
      setResults(cached)
      return // sin llamada al backend
    }

    // ── 2. Llamar al backend ───────────────────────────────────────────────────
    setSearching(true)
    try {
      const res = await searchExternalCards(normalized)
      const cards = res.data || []
      setCachedSearch(normalized, cards) // guardar para próxima vez
      setResults(cards)
    } catch (err) {
      toast.error(err.message || 'Error al buscar cartas')
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  const clearResults = useCallback(() => setResults([]), [])

  return { results, searching, search, clearResults }
}
