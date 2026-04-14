import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, LayoutList } from 'lucide-react'
import { InventoryTable } from '../../components/inventory/InventoryTable'
import { FiltersPanel } from '../../components/filters/FiltersPanel'
import { Button } from '../../components/ui/Button'
import { useCards } from '../../hooks/useCards'
import { useDebounce } from '../../hooks/useDebounce'

export default function InventoryPage() {
  const { cards, loading, actionLoading, fetchCards, editCard, removeCard } = useCards()
  const [filters, setFilters] = useState({ name: '', type: '', archetype: '' })
  const debouncedName = useDebounce(filters.name, 400)

  useEffect(() => {
    fetchCards({
      name: debouncedName,
      type: filters.type,
      archetype: filters.archetype,
    })
  }, [debouncedName, filters.type, filters.archetype])

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Mi Inventario</h1>
          <p className="text-slate-400 text-sm">
            {loading ? 'Cargando...' : `${cards.length} carta${cards.length !== 1 ? 's' : ''} en el inventario`}
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
        />
      </motion.div>
    </div>
  )
}
