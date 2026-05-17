import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { CardItem } from './CardItem'
import { CardDetailModal } from './CardDetailModal'
import { CardSkeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'
import { LayoutGrid, Square, Columns2, List } from 'lucide-react'

export function CardGrid({ cards, loading }) {
  const [selectedCard, setSelectedCard] = useState(null)
  const [mobileCols, setMobileCols] = useState('1')

  if (loading) {
    return (
      <div className={`grid ${mobileCols === '1' ? 'grid-cols-1' : 'grid-cols-2'} sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!cards.length) {
    return (
      <EmptyState
        icon={LayoutGrid}
        title="No hay cartas en el inventario"
        description="Agrega cartas desde el panel de administración para verlas aquí."
      />
    )
  }

  return (
    <>
      {/* Mobile Layout Toggle */}
      <div className="flex justify-end mb-4 sm:hidden">
        <div className="flex gap-1 bg-black/20 p-1 rounded-lg border border-white/5">
          <button
            onClick={() => setMobileCols('list')}
            className={`p-1.5 rounded transition-colors ${
              mobileCols === 'list' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Vista de lista"
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setMobileCols('1')}
            className={`p-1.5 rounded transition-colors ${
              mobileCols === '1' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Vista de 1 columna"
          >
            <Square size={18} />
          </button>
          <button
            onClick={() => setMobileCols('2')}
            className={`p-1.5 rounded transition-colors ${
              mobileCols === '2' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Vista de 2 columnas"
          >
            <Columns2 size={18} />
          </button>
        </div>
      </div>

      <div className={`grid ${
        mobileCols === '1' ? 'grid-cols-1' : 
        mobileCols === '2' ? 'grid-cols-2' : 
        'grid-cols-1'
      } sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5`}>
        <AnimatePresence>
          {cards.map((card) => (
            <CardItem key={card.id} card={card} onSelect={setSelectedCard} viewMode={mobileCols} />
          ))}
        </AnimatePresence>
      </div>

      <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />
    </>
  )
}
