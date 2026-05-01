import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, LayoutList } from 'lucide-react'
import { InventoryTable } from '../../components/inventory/InventoryTable'
import { FiltersPanel } from '../../components/filters/FiltersPanel'
import { Button } from '../../components/ui/Button'
import { useCards } from '../../hooks/useCards'
import { useWishlist } from '../../hooks/useWishlist'
import { useDebounce } from '../../hooks/useDebounce'

export default function InventoryPage() {
  const [currentTab, setCurrentTab] = useState('inventory')
  
  const inv = useCards()
  const wish = useWishlist()
  
  const currentHooks = currentTab === 'inventory' ? inv : wish
  const { cards, loading, actionLoading, fetchCards, editCard, removeCard } = currentHooks
  const [filters, setFilters] = useState({ name: '', type: '', archetype: '' })
  const debouncedName = useDebounce(filters.name, 400)

  useEffect(() => {
    fetchCards({
      name: debouncedName,
      type: filters.type,
      archetype: filters.archetype,
    })
  }, [debouncedName, filters.type, filters.archetype, currentTab])

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Portafolio</h1>
          <p className="text-slate-400 text-sm">
            {loading ? 'Cargando...' : `${cards.length} carta${cards.length !== 1 ? 's' : ''} en ${currentTab === 'inventory' ? 'el inventario' : 'la wishlist'}`}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          loading={loading}
          onClick={() => fetchCards(filters)}
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
      </div>


      {/* Filtros */}
      <div className="glass rounded-xl p-4 mb-6">
        <FiltersPanel filters={filters} onChange={setFilters} />
      </div>

      {/* Tabla */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <InventoryTable
          cards={cards}
          loading={loading}
          onEdit={editCard}
          onDelete={removeCard}
          actionLoading={actionLoading}
          mode={currentTab}
        />
      </motion.div>
    </div>
  )
}
