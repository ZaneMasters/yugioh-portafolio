import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, LayoutList } from 'lucide-react'
import { InventoryTable } from '../../components/inventory/InventoryTable'
import { FiltersPanel } from '../../components/filters/FiltersPanel'
import { FoldersPanel } from '../../components/folders/FoldersPanel'
import { Button } from '../../components/ui/Button'
import { useCards } from '../../hooks/useCards'
import { useWishlist } from '../../hooks/useWishlist'
import { useDebounce } from '../../hooks/useDebounce'
import { useFolders } from '../../hooks/useFolders'

export default function InventoryPage() {
  const [currentTab, setCurrentTab] = useState('inventory') // 'inventory' | 'wishlist' | 'folders'
  
  const inv = useCards()
  const wish = useWishlist()
  const { folders, loading: foldersLoading, actionLoading: foldersActionLoading, fetchFolders, createFolder, updateFolder, deleteFolder } = useFolders()
  
  const currentHooks = currentTab === 'inventory' ? inv : wish
  const { cards = [], loading, actionLoading, fetchCards, editCard, removeCard } = currentHooks || {}
  const [filters, setFilters] = useState({ name: '', type: '', archetype: '' })
  const debouncedName = useDebounce(filters.name, 400)
  const debouncedArchetype = useDebounce(filters.archetype, 400)
  
  // Límite de cartas visibles para paginación visual
  const INITIAL_LIMIT = 20
  const [visibleCount, setVisibleCount] = useState(INITIAL_LIMIT)

  useEffect(() => {
    if (currentTab !== 'folders') {
      setVisibleCount(INITIAL_LIMIT)
      fetchCards({
        name: debouncedName,
        type: filters.type,
        archetype: debouncedArchetype,
        folderId: filters.folderId,
      })
    }
  }, [debouncedName, filters.type, debouncedArchetype, filters.folderId, currentTab])

  useEffect(() => {
    fetchFolders()
  }, [])

  const displayedCards = cards?.slice(0, visibleCount) || []
  const hasMoreCards = cards && visibleCount < cards.length

  const observerTarget = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreCards) {
          setVisibleCount((prev) => prev + 20)
        }
      },
      { rootMargin: '300px' }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [hasMoreCards])

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Portafolio</h1>
          <p className="text-slate-400 text-sm">
            {currentTab === 'folders'
              ? (foldersLoading ? 'Cargando...' : `${folders.length} colección${folders.length !== 1 ? 'es' : ''}`)
              : (loading ? 'Cargando...' : `${cards.length} carta${cards.length !== 1 ? 's' : ''} en ${currentTab === 'inventory' ? 'el inventario' : 'la wishlist'}`)
            }
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          loading={loading}
          onClick={() => {
            if (currentTab !== 'folders') fetchCards(filters)
            else fetchFolders()
          }}
        >
          Actualizar
        </Button>
      </div>

      {/* Pestañas (Tabs) */}
      <div className="flex border-b border-white/10 mb-6">
        <button
          onClick={() => setCurrentTab('inventory')}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            currentTab === 'inventory'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-white/20'
          }`}
        >
          Mi Inventario
        </button>
        <button
          onClick={() => setCurrentTab('wishlist')}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            currentTab === 'wishlist'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-white/20'
          }`}
        >
          Wishlist
        </button>
        <button
          onClick={() => setCurrentTab('folders')}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            currentTab === 'folders'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-white/20'
          }`}
        >
          Colecciones
        </button>
      </div>


      {/* Filtros */}
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
              setFilters(prev => ({ ...prev, folderId }))
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
              cards={displayedCards}
              loading={loading}
              onEdit={editCard}
              onDelete={removeCard}
              actionLoading={actionLoading}
              mode={currentTab}
              folders={folders}
            />
            
            {/* Intersection Observer Target */}
            <div ref={observerTarget} className="h-10 mt-8 flex justify-center">
              {hasMoreCards && (
                <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
}
