import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { CardItem } from './CardItem'
import { CardDetailModal } from './CardDetailModal'
import { CardSkeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'
import { LayoutGrid } from 'lucide-react'

export function CardGrid({ cards, loading }) {
  const [selectedCard, setSelectedCard] = useState(null)

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <AnimatePresence>
          {cards.map((card) => (
            <CardItem key={card.id} card={card} onSelect={setSelectedCard} />
          ))}
        </AnimatePresence>
      </div>

      <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />
    </>
  )
}
