import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, TrendingUp, Share2, ExternalLink } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { InventoryTable } from '../../components/inventory/InventoryTable'
import { FiltersPanel } from '../../components/filters/FiltersPanel'
import { FoldersPanel } from '../../components/folders/FoldersPanel'
import { Button } from '../../components/ui/Button'
import { useCards } from '../../hooks/useCards'
import { useWishlist } from '../../hooks/useWishlist'
import { useDebounce } from '../../hooks/useDebounce'
import { useFolders } from '../../hooks/useFolders'
import { queryKeys } from '../../lib/queryKeys'

export default function InventoryPage() {
  const [currentTab, setCurrentTab] = useState('inventory') // 'inventory' | 'wishlist' | 'folders'
  const [filters, setFilters] = useState({ name: '', type: '', archetype: '', folderId: '' })
  const queryClient = useQueryClient()

  const debouncedNameRaw      = useDebounce(filters.name, 400)
  const debouncedArchetypeRaw = useDebounce(filters.archetype, 400)

  const debouncedName      = filters.name === '' ? '' : debouncedNameRaw
  const debouncedArchetype = filters.archetype === '' ? '' : debouncedArchetypeRaw

  const handleTabChange = (tab) => {
    if (tab !== currentTab) {
      setCurrentTab(tab)
      setFilters({ name: '', type: '', archetype: '', folderId: '' })
    }
  }

  // Filtros debounced para pasar al hook
  const activeFilters = {
    name:      debouncedName,
    type:      filters.type,
    archetype: debouncedArchetype,
    folderId:  filters.folderId,
  }

  // TanStack Query: los hooks reciben los filtros directamente,
  // y solo fetchean cuando el tab correspondiente está activo.
  const invHook  = useCards(currentTab === 'inventory' ? activeFilters : null)
  const wishHook = useWishlist(currentTab === 'wishlist' ? activeFilters : null)
  const { folders, loading: foldersLoading, actionLoading: foldersActionLoading,
          createFolder, updateFolder, deleteFolder, fetchFolders } = useFolders()

  const currentHook = currentTab === 'inventory' ? invHook : wishHook
  const { 
    cards = [], 
    totalCount = 0, 
    totalQuantity = 0, 
    loading, 
    actionLoading, 
    editCard, 
    removeCard, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = currentHook

  const observerTarget = useRef(null)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '300px' }
    )
    if (observerTarget.current) observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const { user, profile } = useAuth()
  const userSlug = profile?.slug || user?.email?.split('@')[0] || ''

  const handleSharePortfolio = (tab = 'inventory') => {
    if (!userSlug) {
      toast.error('No se pudo identificar la URL de tu portafolio.')
      return
    }
    const tabParam = tab === 'wishlist' ? '?tab=wishlist' : ''
    const publicUrl = `${window.location.origin}/portfolio/${userSlug}${tabParam}`
    navigator.clipboard.writeText(publicUrl)
    toast.success(
      tab === 'wishlist'
        ? '¡Enlace de tu Wishlist copiado! (Solo mostrará tus cartas públicas)'
        : '¡Enlace de tu Colección pública copiado!'
    )
  }

  const handleRefresh = () => {
    if (currentTab === 'inventory') {
      queryClient.invalidateQueries({ queryKey: ['cards'] })
    } else if (currentTab === 'wishlist') {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
    } else {
      fetchFolders()
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Portafolio</h1>
          <p className="text-slate-400 text-sm">
            {currentTab === 'folders'
              ? (foldersLoading ? 'Cargando...' : `${folders.length} colección${folders.length !== 1 ? 'es' : ''}`)
              : (loading 
                  ? 'Cargando...' 
                  : totalQuantity > totalCount
                    ? `${totalCount} cartas distintas (${totalQuantity} copias en total) en ${currentTab === 'inventory' ? 'el inventario' : 'la wishlist'}`
                    : `${totalCount} carta${totalCount !== 1 ? 's' : ''} en ${currentTab === 'inventory' ? 'el inventario' : 'la wishlist'}`
                )
            }
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {userSlug && (
            <>
              <Button
                variant="outline"
                size="sm"
                icon={Share2}
                onClick={() => handleSharePortfolio(currentTab)}
                title={
                  currentTab === 'wishlist'
                    ? 'Copiar enlace directo de tu wishlist pública'
                    : 'Copiar enlace directo de tu colección pública'
                }
              >
                {currentTab === 'wishlist' ? 'Compartir Wishlist' : 'Compartir Colección'}
              </Button>
              <a
                href={`/portfolio/${userSlug}${currentTab === 'wishlist' ? '?tab=wishlist' : ''}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                title="Abrir tu portafolio público en una pestaña nueva"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Ver Pública
              </a>
            </>
          )}
          {currentTab === 'inventory' && (
            <Button
              variant="outline"
              size="sm"
              icon={TrendingUp}
              loading={invHook.syncPricesLoading}
              onClick={() => invHook.syncPrices(true)}
              title="Forzar actualización de precios con TCGPlayer"
            >
              Actualizar Precios TCG
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={loading || foldersLoading}
            onClick={handleRefresh}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* Pestañas (Tabs) */}
      <div className="flex border-b border-white/10 mb-6">
        {['inventory', 'wishlist', 'folders'].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              currentTab === tab
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-white/20'
            }`}
          >
            {tab === 'inventory' ? 'Mi Inventario' : tab === 'wishlist' ? 'Wishlist' : 'Colecciones'}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {currentTab === 'folders' ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <FoldersPanel
            folders={folders}
            loading={foldersLoading}
            actionLoading={foldersActionLoading}
            createFolder={createFolder}
            updateFolder={updateFolder}
            deleteFolder={deleteFolder}
            onFolderClick={(folderId) => {
              setFilters((prev) => ({ ...prev, folderId }))
              setCurrentTab('inventory')
            }}
          />
        </motion.div>
      ) : (
        <>
          <div className="glass rounded-xl p-4 mb-6">
            <FiltersPanel
              filters={filters}
              onChange={setFilters}
              folders={currentTab === 'inventory' ? folders : []}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <InventoryTable
              cards={cards}
              loading={loading && cards.length === 0}
              onEdit={editCard}
              onDelete={removeCard}
              actionLoading={actionLoading}
              mode={currentTab}
              folders={folders}
            />

            {/* Intersection Observer Target */}
            <div ref={observerTarget} className="h-10 mt-8 flex justify-center">
              {isFetchingNextPage && (
                <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
              )}
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
}
