import { useState, useMemo, useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { CardItem } from './CardItem'
import { CardDetailModal } from './CardDetailModal'
import { CardSkeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'
import { LayoutGrid, Square, Columns2, List } from 'lucide-react'

export function CardGrid({ 
  cards, 
  loading, 
  emptyStateTitle = "No hay cartas en el inventario",
  emptyStateDescription = "Agrega cartas desde el panel de administración para verlas aquí.",
  isPublic = false,
  isWishlist = false
}) {
  const [selectedCard, setSelectedCard] = useState(null)
  const [mobileCols, setMobileCols] = useState('1')
  
  // ─── Virtualización: Determinar columnas ─────────────────────────────────────
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const colCount = useMemo(() => {
    if (windowWidth >= 1280) return 4
    if (windowWidth >= 1024) return 3
    if (windowWidth >= 640) return 2
    return mobileCols === 'list' ? 1 : (parseInt(mobileCols, 10) || 1)
  }, [windowWidth, mobileCols])

  // Agrupar cartas en filas
  const rows = useMemo(() => {
    const r = []
    for (let i = 0; i < cards.length; i += colCount) {
      r.push(cards.slice(i, i + colCount))
    }
    return r
  }, [cards, colCount])

  // Ref del contenedor para saber a qué altura empieza el grid en la página
  const listRef = useRef(null)
  const [scrollMargin, setScrollMargin] = useState(0)

  useEffect(() => {
    if (listRef.current) {
      // Calculamos la posición real desde el top absoluto de la página
      const rect = listRef.current.getBoundingClientRect()
      setScrollMargin(rect.top + window.scrollY)
    }
  }, [cards.length, colCount]) // Recalcular si cambia el layout superior

  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => mobileCols === 'list' ? 140 : 400,
    overscan: 3, // Cargar 3 filas extra fuera de pantalla para que el scroll sea fluido
    scrollMargin,
  })

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
        title={emptyStateTitle}
        description={emptyStateDescription}
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

      {/* Grid Virtualizado */}
      <div 
        ref={listRef} 
        style={{ 
          height: `${virtualizer.getTotalSize()}px`, 
          width: '100%', 
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const rowCards = rows[virtualRow.index]
          
          return (
            <div
              key={virtualRow.index}
              ref={virtualizer.measureElement}
              data-index={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
              }}
            >
              <div className={`grid ${
                colCount === 1 ? 'grid-cols-1' : 
                colCount === 2 ? 'grid-cols-2' : 
                colCount === 3 ? 'grid-cols-3' : 
                'grid-cols-4'
              } gap-4 sm:gap-5 pb-4 sm:pb-5`}>
                <AnimatePresence>
                  {rowCards.map((card) => (
                    <CardItem 
                      key={card.id} 
                      card={card} 
                      onSelect={setSelectedCard} 
                      viewMode={mobileCols} 
                      // Desactivar animaciones pesadas durante scroll rápido
                      disableAnimation={virtualizer.isScrolling || virtualRow.index > 0} 
                      isPublic={isPublic}
                      isWishlist={isWishlist}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )
        })}
      </div>

      <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} isPublic={isPublic} isWishlist={isWishlist} />
    </>
  )
}
