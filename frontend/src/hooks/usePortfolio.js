import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import * as cardService from '../services/cardService'
import * as wishlistService from '../services/wishlistService'

/**
 * Hook para cargar el portafolio público de un usuario por su slug.
 * Implementa paginación cursor-based: fetchPortfolio() carga la primera
 * página, fetchMorePortfolio() carga las siguientes usando el cursor del backend.
 *
 * @param {string} slug - Prefijo del email (ej. 'angel')
 */
export function usePortfolio(slug) {
  const [cards, setCards]           = useState([])
  const [loading, setLoading]       = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [notFound, setNotFound]     = useState(false)
  const [hasMore, setHasMore]       = useState(false)
  const [nextCursor, setNextCursor] = useState(null)
  const [totalCount, setTotalCount] = useState(0)

  // ── Portafolio (inventario) ──────────────────────────────────────────────────

  const fetchPortfolio = useCallback(async (filters = {}) => {
    if (!slug) return
    setLoading(true)
    setNotFound(false)
    setCards([])
    setNextCursor(null)
    setHasMore(false)
    try {
      const res = await cardService.getPortfolioCards(slug, filters, null)
      setCards(res.data ?? [])
      setHasMore(res.hasMore ?? false)
      setNextCursor(res.nextCursor ?? null)
      setTotalCount(res.totalCount ?? (res.data?.length || 0))
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

  const fetchMorePortfolio = useCallback(async (filters = {}) => {
    if (!slug || !nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await cardService.getPortfolioCards(slug, filters, nextCursor)
      setCards((prev) => [...prev, ...(res.data ?? [])])
      setHasMore(res.hasMore ?? false)
      setNextCursor(res.nextCursor ?? null)
      // totalCount no suele cambiar en la paginación, pero se puede actualizar
      if (res.totalCount !== undefined) setTotalCount(res.totalCount)
    } catch (err) {
      toast.error(err.message || 'Error al cargar más cartas')
    } finally {
      setLoadingMore(false)
    }
  }, [slug, nextCursor, loadingMore])

  // ── Wishlist pública ─────────────────────────────────────────────────────────

  const fetchPublicWishlist = useCallback(async (filters = {}) => {
    if (!slug) return
    setLoading(true)
    setNotFound(false)
    setCards([])
    setNextCursor(null)
    setHasMore(false)
    try {
      const res = await wishlistService.getPublicWishlist(slug, filters, null)
      setCards(res.data ?? [])
      setHasMore(res.hasMore ?? false)
      setNextCursor(res.nextCursor ?? null)
      setTotalCount(res.totalCount ?? (res.data?.length || 0))
    } catch (err) {
      if (err.message?.includes('404') || err.message?.toLowerCase().includes('no existe')) {
        setNotFound(true)
        setCards([])
      } else {
        toast.error(err.message || 'Error al cargar la wishlist')
      }
    } finally {
      setLoading(false)
    }
  }, [slug])

  const fetchMoreWishlist = useCallback(async (filters = {}) => {
    if (!slug || !nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await wishlistService.getPublicWishlist(slug, filters, nextCursor)
      setCards((prev) => [...prev, ...(res.data ?? [])])
      setHasMore(res.hasMore ?? false)
      setNextCursor(res.nextCursor ?? null)
      if (res.totalCount !== undefined) setTotalCount(res.totalCount)
    } catch (err) {
      toast.error(err.message || 'Error al cargar más wishlist')
    } finally {
      setLoadingMore(false)
    }
  }, [slug, nextCursor, loadingMore])

  return {
    cards,
    loading,
    loadingMore,
    notFound,
    hasMore,
    totalCount,
    fetchPortfolio,
    fetchMorePortfolio,
    fetchPublicWishlist,
    fetchMoreWishlist,
  }
}
