import { useState, useEffect, useCallback } from 'react'
import { Navbar } from '../../components/layout/Navbar'
import { CardGrid } from '../../components/cards/CardGrid'
import { FiltersPanel } from '../../components/filters/FiltersPanel'
import { useCards } from '../../hooks/useCards'
import { useDebounce } from '../../hooks/useDebounce'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export default function GalleryPage() {
  const { cards, loading, fetchCards } = useCards()
  const [filters, setFilters] = useState({ name: '', type: '', archetype: '' })
  const debouncedName = useDebounce(filters.name, 400)

  // Refetch cuando cambian los filtros (con debounce en nombre)
  useEffect(() => {
    fetchCards({
      name: debouncedName,
      type: filters.type,
      archetype: filters.archetype,
    })
  }, [debouncedName, filters.type, filters.archetype])

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
            Colección Personal
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-3">
            Mi Inventario de{' '}
            <span className="text-gradient">Yu-Gi-Oh!</span>
          </h1>
          <p className="text-slate-400 text-base max-w-md mx-auto">
            {cards.length > 0
              ? `${cards.length} carta${cards.length === 1 ? '' : 's'} en la colección`
              : 'Explora mi colección de cartas'}
          </p>
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 p-4 rounded-xl glass"
        >
          <FiltersPanel filters={filters} onChange={setFilters} />
        </motion.div>

        {/* Grid */}
        <CardGrid cards={cards} loading={loading} />
      </main>
    </div>
  )
}
