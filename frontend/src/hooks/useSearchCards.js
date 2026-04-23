import { useState, useCallback, useRef } from 'react'
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
 *
 * Cancelación: cada búsqueda cancela la anterior en vuelo (AbortController)
 * para evitar actualizaciones de estado con resultados obsoletos.
 */
export function useSearchCards() {
  const [results, setResults]     = useState([])
  const [searching, setSearching] = useState(false)
  const abortRef = useRef(null)

  const search = useCallback(async (name, lang = 'en') => {
    // Cancelar petición anterior si todavía está en vuelo
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }

    if (!name || name.trim().length < 2) {
      setResults([])
      setSearching(false)
      return
    }

    const normalized = name.trim()

    // ── 1. Intentar caché ──────────────────────────────────────────────────────
    const cached = getCachedSearch(normalized, lang)
    if (cached) {
      setResults(cached)
      setSearching(false)
      return // sin llamada al backend
    }

    // ── 2. Llamar al backend ───────────────────────────────────────────────────
    const controller = new AbortController()
    abortRef.current = controller
    setSearching(true)

    try {
      const res = await searchExternalCards(normalized, lang, controller.signal)
      // Si esta petición ya fue cancelada, ignorar el resultado
      if (controller.signal.aborted) return

      const cards = res.data || []
      setCachedSearch(normalized, cards, lang)
      setResults(cards)
    } catch (err) {
      // Error de cancelación — no mostrar toast, es intencional
      if (err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED') return
      toast.error(err.message || 'Error al buscar cartas')
      setResults([])
    } finally {
      if (!controller.signal.aborted) {
        setSearching(false)
      }
    }
  }, [])

  const clearResults = useCallback(() => {
    if (abortRef.current) abortRef.current.abort()
    setResults([])
    setSearching(false)
  }, [])

  return { results, searching, search, clearResults }
}
