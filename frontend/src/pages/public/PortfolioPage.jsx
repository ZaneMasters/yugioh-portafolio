import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Sparkles, Ghost } from 'lucide-react'
import { Navbar } from '../../components/layout/Navbar'
import { CardGrid } from '../../components/cards/CardGrid'
import { FiltersPanel } from '../../components/filters/FiltersPanel'
import { usePortfolio } from '../../hooks/usePortfolio'
import { useDebounce } from '../../hooks/useDebounce'
import { usePublicFolders } from '../../hooks/usePublicFolders'

/**
 * Página de portafolio público de un usuario.
 * Accesible en: /portfolio/:slug
 * Usa useInfiniteQuery via usePortfolio para paginación cursor-based.
 */
export default function PortfolioPage() {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState({ name: '', type: '', archetype: '', folderId: '' })
  const { folders } = usePublicFolders(slug)

  const currentTab = searchParams.get('tab') === 'wishlist' ? 'wishlist' : 'inventory'

  const handleTabChange = (tab) => {
    setSearchParams((prev) => { prev.set('tab', tab); return prev })
    // Limpiar filtros al cambiar de tab
    setFilters({ name: '', type: '', archetype: '', folderId: '' })
  }

  const debouncedName      = useDebounce(filters.name, 400)
  const debouncedArchetype = useDebounce(filters.archetype, 400)

  const activeFilters = {
    name:      debouncedName,
    type:      filters.type,
    archetype: debouncedArchetype,
    folderId:  filters.folderId,
  }

  const {
    cards, loading, loadingMore, notFound, hasMore, totalCount, fetchNextPage,
  } = usePortfolio(slug, currentTab, activeFilters)

  const displayName = slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : ''



  const observerTarget = useRef(null)

  // IntersectionObserver — carga más cartas con scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchNextPage()
        }
      },
      { rootMargin: '300px' }
    )
    if (observerTarget.current) observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, fetchNextPage])

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

  const pageTitle = `${currentTab === 'inventory' ? 'Colección' : 'Wishlist'} de ${displayName} — Yu-Gi-Oh! Inventory`
  const pageDescription = `Explora la ${currentTab === 'inventory' ? 'colección de cartas' : 'lista de deseos'} de ${displayName}. Descubre sus cartas favoritas de Yu-Gi-Oh!`

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />

        {/* Open Graph */}
        <meta property="og:type"        content="profile" />
        <meta property="og:site_name"   content="Yu-Gi-Oh! Inventory" />
        <meta property="og:title"       content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url"         content={`https://yugioh-8fc03.web.app/portfolio/${slug}`} />
        <meta property="og:image"       content="https://yugioh-8fc03.web.app/og-image.png" />
        <meta property="og:image:type"  content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt"   content={`Portafolio de ${displayName} — Yu-Gi-Oh! Inventory`} />
        <meta property="og:locale"      content="es_ES" />

        {/* Twitter / X */}
        <meta name="twitter:card"        content="summary_large_image" />
        <meta name="twitter:title"       content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image"       content="https://yugioh-8fc03.web.app/og-image.png" />
        <meta name="twitter:image:alt"   content={`Portafolio de ${displayName} — Yu-Gi-Oh! Inventory`} />
      </Helmet>

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <div className="mb-4" />

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
          {['inventory', 'wishlist'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                currentTab === tab
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-white/20'
              }`}
            >
              {tab === 'inventory' ? 'Colección' : 'Wishlist'}
            </button>
          ))}
        </div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8 p-4 rounded-xl glass"
        >
          <FiltersPanel
            filters={filters}
            onChange={setFilters}
            folders={currentTab === 'inventory' ? folders : []}
          />
        </motion.div>

        {/* Grid de cartas */}
        <CardGrid cards={cards} loading={loading} />

        {/* Intersection Observer Target */}
        <div ref={observerTarget} className="h-10 mt-10 flex justify-center">
          {loadingMore && (
            <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          )}
        </div>
      </main>
    </div>
  )
}
