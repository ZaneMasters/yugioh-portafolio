import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Ghost } from 'lucide-react'
import { Navbar } from '../../components/layout/Navbar'
import { CardGrid } from '../../components/cards/CardGrid'
import { FiltersPanel } from '../../components/filters/FiltersPanel'
import { usePortfolio } from '../../hooks/usePortfolio'
import { useDebounce } from '../../hooks/useDebounce'

/**
 * Página de portafolio público de un usuario.
 * Accesible en: /portfolio/:slug
 * Usa paginación cursor-based del backend: carga 20 cartas iniciales y
 * obtiene más automáticamente cuando el usuario hace scroll al final.
 */
export default function PortfolioPage() {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    cards, loading, loadingMore, notFound, hasMore, totalCount,
    fetchPortfolio, fetchMorePortfolio,
    fetchPublicWishlist, fetchMoreWishlist,
  } = usePortfolio(slug)
  const [filters, setFilters] = useState({ name: '', type: '', archetype: '' })

  const currentTab = searchParams.get('tab') === 'wishlist' ? 'wishlist' : 'inventory'

  const handleTabChange = (tab) => {
    setSearchParams((prev) => {
      prev.set('tab', tab)
      return prev
    })
  }

  const debouncedName = useDebounce(filters.name, 400)
  const debouncedArchetype = useDebounce(filters.archetype, 400)

  // Nombre para mostrar — capitaliza la primera letra del slug
  const displayName = slug
    ? slug.charAt(0).toUpperCase() + slug.slice(1)
    : ''

  // ── Todos los hooks deben declararse antes de cualquier return condicional ──
  const observerTarget = useRef(null)

  // Actualizar título de la pestaña dinámicamente
  useEffect(() => {
    if (displayName) {
      const tabLabel = currentTab === 'inventory' ? 'Colección' : 'Wishlist'
      document.title = `${tabLabel} de ${displayName} — Yu-Gi-Oh! Inventory`
    }
    return () => { document.title = 'Yu-Gi-Oh! Inventory — Gestiona tu colección' }
  }, [displayName, currentTab])

  // Refetch cuando cambian los filtros o la pestaña (reset de cursor)
  useEffect(() => {
    const params = {
      name:      debouncedName,
      type:      filters.type,
      archetype: debouncedArchetype,
    }
    if (currentTab === 'inventory') {
      fetchPortfolio(params)
    } else {
      fetchPublicWishlist(params)
    }
  }, [debouncedName, filters.type, debouncedArchetype, currentTab, fetchPortfolio, fetchPublicWishlist])

  // IntersectionObserver — carga más cartas cuando el usuario llega al final
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          const params = {
            name:      debouncedName,
            type:      filters.type,
            archetype: debouncedArchetype,
          }
          if (currentTab === 'inventory') {
            fetchMorePortfolio(params)
          } else {
            fetchMoreWishlist(params)
          }
        }
      },
      { rootMargin: '300px' }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loadingMore, debouncedName, filters.type, debouncedArchetype, currentTab, fetchMorePortfolio, fetchMoreWishlist])

  // ── Estado: usuario no encontrado ──────────────────────────────────────────
  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <Ghost className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              Portafolio no encontrado
            </h1>
            <p className="text-slate-400 mb-2">
              No hemos podido encontrar ningún coleccionista bajo la URL{' '}
              <span className="text-amber-400 font-mono">"{slug}"</span>.
            </p>
            <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              Es posible que el usuario haya cambiado su nombre público recientemente o que el enlace contenga un error tipográfico. Por favor, pídele el enlace correcto.
            </p>
          </motion.div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen ">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Portafolio de {displayName}
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 font-display">
            {currentTab === 'inventory' ? 'Colección de ' : 'Cartas Buscadas por '}
            <span className="text-gradient">{displayName}</span>
          </h1>

          <p className="text-slate-400 text-base max-w-md mx-auto">
            {loading
              ? 'Cargando...'
              : totalCount > 0
              ? `${totalCount} carta${totalCount === 1 ? '' : 's'} en la ${currentTab === 'inventory' ? 'colección' : 'wishlist'}`
              : currentTab === 'inventory'
                ? 'Esta colección está vacía por ahora'
                : 'No hay cartas en la wishlist'}
          </p>
        </motion.div>

        {/* Pestañas (Tabs) */}
        <div className="flex justify-center border-b border-white/10 mb-8 max-w-lg mx-auto">
          <button
            onClick={() => handleTabChange('inventory')}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
              currentTab === 'inventory'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-white/20'
            }`}
          >
            Colección
          </button>
          <button
            onClick={() => handleTabChange('wishlist')}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
              currentTab === 'wishlist'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-white/20'
            }`}
          >
            Wishlist
          </button>
        </div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8 p-4 rounded-xl glass"
        >
          <FiltersPanel filters={filters} onChange={setFilters} />
        </motion.div>

        {/* Grid de cartas */}
        <CardGrid cards={cards} loading={loading} />

        {/* Intersection Observer Target — trigger de carga incremental */}
        <div ref={observerTarget} className="h-10 mt-10 flex justify-center">
          {loadingMore && (
            <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          )}
        </div>
      </main>
    </div>
  )
}
