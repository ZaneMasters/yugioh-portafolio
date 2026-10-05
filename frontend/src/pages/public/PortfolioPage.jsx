import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Ghost, ShoppingCart, Layers, Heart, MessageCircle } from 'lucide-react'
import { Navbar } from '../../components/layout/Navbar'
import { CardGrid } from '../../components/cards/CardGrid'
import { FiltersPanel } from '../../components/filters/FiltersPanel'
import { usePortfolio } from '../../hooks/usePortfolio'
import { useDebounce } from '../../hooks/useDebounce'
import { usePublicFolders } from '../../hooks/usePublicFolders'
import { HeroBackground } from '../../components/ui/HeroBackground'
import { CartSidebar } from '../../components/cart/CartSidebar'
import { ShinyText } from '../../components/ui/ShinyText'
import { CountUp } from '../../components/ui/CountUp'
import { useCartStore } from '../../store/useCartStore'

/**
 * Página de portafolio público de un usuario.
 * Accesible en: /portfolio/:slug
 * Usa useInfiniteQuery via usePortfolio para paginación cursor-based con sincronización en vivo.
 */
export default function PortfolioPage() {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState({ name: '', setCode: '', type: '', archetype: '', folderId: '' })
  const { folders } = usePublicFolders(slug)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const items = useCartStore(state => state.items)
  const totalCartItems = items.reduce((total, item) => total + item.cartQuantity, 0)
  const totalCartPrice = useCartStore(state => state.getTotalPrice())

  const currentTab = searchParams.get('tab') === 'wishlist' ? 'wishlist' : 'inventory'

  const handleTabChange = (tab) => {
    setSearchParams((prev) => { prev.set('tab', tab); return prev })
    // Limpiar filtros al cambiar de tab
    setFilters({ name: '', setCode: '', type: '', archetype: '', folderId: '' })
  }

  const debouncedName      = useDebounce(filters.name, 400)
  const debouncedSetCode   = useDebounce(filters.setCode, 400)
  const debouncedArchetype = useDebounce(filters.archetype, 400)

  const activeFilters = {
    name:      debouncedName,
    setCode:   debouncedSetCode,
    type:      filters.type,
    archetype: debouncedArchetype,
    folderId:  filters.folderId,
  }

  const {
    cards, whatsapp, loading, loadingMore, notFound, hasMore, totalCount, totalQuantity, fetchNextPage,
  } = usePortfolio(slug, currentTab, activeFilters)

  const displayName = slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : ''
  const activeFolder = folders?.find(f => f.id === filters.folderId)
  const folderName = activeFolder ? activeFolder.name : ''

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Banner Hero Épico */}
        <div className="relative w-full min-h-[170px] sm:min-h-[200px] mb-6 rounded-2xl overflow-hidden shadow-xl border border-white/10">
          {/* Fondo Animado Carrusel */}
          <HeroBackground />
          {/* Gradientes para integración y legibilidad */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080a11] via-[#080a11]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080a11]/90 via-[#080a11]/40 to-transparent" />

          {/* Contenido del Banner */}
          <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-7">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Badges de estado superior */}
              {whatsapp && (
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[11px] font-semibold backdrop-blur-sm">
                    <MessageCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>WhatsApp para pedidos activo</span>
                  </span>
                </div>
              )}

              <h1 className="text-2xl sm:text-3xl font-black text-white mb-1 font-display drop-shadow-[0_0_12px_rgba(0,0,0,0.9)]">
                {currentTab === 'inventory' ? 'Colección de ' : 'Cartas Buscadas por '}
                <ShinyText
                  text={displayName}
                  color="#f59e0b"
                  shineColor="#ffffff"
                  speed={3.5}
                  className="font-display font-black text-gradient"
                />
              </h1>

              <div className="text-slate-300 text-xs sm:text-sm max-w-xl font-medium drop-shadow-md flex items-center gap-1.5 flex-wrap">
                {loading ? (
                  <span>Consultando los registros del milenio...</span>
                ) : totalCount > 0 ? (
                  <>
                    <span className="font-stat font-bold text-amber-300 text-sm sm:text-base">
                      <CountUp to={totalCount} />
                    </span>
                    <span>cartas distintas</span>
                    {totalQuantity > totalCount && (
                      <span className="text-slate-400">
                        (<span className="font-stat font-bold text-amber-300"><CountUp to={totalQuantity} /></span> en total)
                      </span>
                    )}
                    <span>en su {currentTab === 'inventory' ? 'colección' : 'wishlist'}</span>
                  </>
                ) : currentTab === 'inventory' ? (
                  <span>Esta colección está vacía por ahora</span>
                ) : (
                  <span>No hay cartas en la wishlist</span>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Pestañas (Tabs) Segmentadas con Iconos y Reglas Better-UI */}
        <div className="flex justify-center mb-8 max-w-sm mx-auto">
          <div className="flex p-1 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-md w-full">
            <button
              onClick={() => handleTabChange('inventory')}
              className={`flex-1 flex items-center justify-center gap-2 ps-3.5 pe-4 py-2 rounded-lg text-xs sm:text-sm font-semibold active:scale-[0.96] transition-[background-color,color,box-shadow,transform] duration-150 ease-out cursor-pointer ${
                currentTab === 'inventory'
                  ? 'bg-amber-500 text-black shadow-[0_2px_12px_rgba(245,158,11,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Layers className="w-4 h-4 stroke-2" />
              <span>Colección</span>
            </button>
            <button
              onClick={() => handleTabChange('wishlist')}
              className={`flex-1 flex items-center justify-center gap-2 ps-3.5 pe-4 py-2 rounded-lg text-xs sm:text-sm font-semibold active:scale-[0.96] transition-[background-color,color,box-shadow,transform] duration-150 ease-out cursor-pointer ${
                currentTab === 'wishlist'
                  ? 'bg-rose-500 text-white shadow-[0_2px_12px_rgba(244,63,94,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Heart className="w-4 h-4 stroke-2" />
              <span>Wishlist</span>
            </button>
          </div>
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
        <CardGrid 
          cards={cards} 
          loading={loading} 
          isPublic={true}
          isWishlist={currentTab === 'wishlist'}
          emptyStateTitle={
            currentTab === 'inventory' 
              ? folderName 
                ? `No hay cartas en la colección "${folderName}"`
                : "No hay cartas en la colección pública"
              : "No hay cartas en la wishlist"
          }
          emptyStateDescription={
            currentTab === 'inventory'
              ? folderName
                ? "Este usuario no ha agregado cartas a esta colección todavía."
                : "Este usuario no tiene cartas en su colección pública todavía."
              : "Este usuario no tiene cartas en su lista de deseos todavía."
          }
        />

        {/* Intersection Observer Target */}
        <div ref={observerTarget} className="h-10 mt-10 flex justify-center">
          {loadingMore && (
            <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          )}
        </div>
      </main>

      {/* Botón flotante del Carrito */}
      {totalCartItems > 0 && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsCartOpen(true)}
          className={`fixed bottom-6 right-6 z-40 bg-amber-500 text-black shadow-[0_8px_32px_rgba(245,158,11,0.45)] flex items-center justify-center hover:bg-amber-400 transition-[background-color,box-shadow,transform] duration-150 ease-out cursor-pointer ${
            totalCartPrice > 0 ? 'px-4 py-3.5 rounded-full gap-2.5' : 'p-4 rounded-full'
          }`}
          title="Ver carrito"
        >
          <div className="relative flex items-center justify-center">
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-2.5 -right-2.5 bg-red-500 text-white text-[10px] font-extrabold min-w-4 h-4 px-1 flex items-center justify-center rounded-full shadow-md border-2 border-[#0f1117]">
              {totalCartItems > 99 ? '99+' : totalCartItems}
            </span>
          </div>
          {totalCartPrice > 0 && (
            <span className="font-mono font-bold text-sm text-black border-l border-black/20 pl-2">
              ${totalCartPrice.toFixed(2)}
            </span>
          )}
        </motion.button>
      )}

      {/* Cart Sidebar */}
      <CartSidebar 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        whatsappNumber={whatsapp}
        sellerName={displayName}
        sellerSlug={slug}
      />
    </div>
  )
}
