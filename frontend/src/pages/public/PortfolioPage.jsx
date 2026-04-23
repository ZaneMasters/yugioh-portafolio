import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, User, Ghost } from 'lucide-react'
import { Navbar } from '../../components/layout/Navbar'
import { CardGrid } from '../../components/cards/CardGrid'
import { FiltersPanel } from '../../components/filters/FiltersPanel'
import { usePortfolio } from '../../hooks/usePortfolio'
import { useDebounce } from '../../hooks/useDebounce'

/**
 * Página de portafolio público de un usuario.
 * Accesible en: /portfolio/:slug
 * El slug es el prefijo del email (ej. 'angel' para angel@yugioh.com)
 */
export default function PortfolioPage() {
  const { slug } = useParams()
  const { cards, loading, notFound, fetchPortfolio } = usePortfolio(slug)
  const [filters, setFilters] = useState({ name: '', type: '', archetype: '' })
  const debouncedName = useDebounce(filters.name, 400)

  // Nombre para mostrar — capitaliza la primera letra del slug
  const displayName = slug
    ? slug.charAt(0).toUpperCase() + slug.slice(1)
    : ''

  // Refetch cuando cambian los filtros
  useEffect(() => {
    fetchPortfolio({
      name:      debouncedName,
      type:      filters.type,
      archetype: filters.archetype,
    })
  }, [debouncedName, filters.type, filters.archetype, fetchPortfolio])

  // ── Estado: usuario no encontrado ─────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="min-h-screen bg-[#0d0f1a] flex flex-col">
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
            <p className="text-slate-400 mb-6">
              No existe ningún coleccionista con el slug{' '}
              <span className="text-amber-400 font-mono">"{slug}"</span>.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-colors"
            >
              Volver al inicio
            </Link>
          </motion.div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d0f1a]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          {/* Avatar / badge del coleccionista */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-purple-600 flex items-center justify-center shadow-lg shadow-amber-500/20 mx-auto mb-4"
          >
            <User className="w-8 h-8 text-white" />
          </motion.div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Portafolio de {displayName}
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white mb-3">
            Colección de{' '}
            <span className="text-gradient">{displayName}</span>
          </h1>

          <p className="text-slate-400 text-base max-w-md mx-auto">
            {loading
              ? 'Cargando colección...'
              : cards.length > 0
              ? `${cards.length} carta${cards.length === 1 ? '' : 's'} en la colección`
              : 'Esta colección está vacía por ahora'}
          </p>
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8 p-4 rounded-xl glass"
        >
          <FiltersPanel filters={filters} onChange={setFilters} />
        </motion.div>

        {/* Grid de cartas */}
        <CardGrid cards={cards} loading={loading} />
      </main>
    </div>
  )
}
