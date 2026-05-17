import { useState } from 'react'
import { Filter, Search, X, Sword, Zap, Star, Layers, Link2, Scroll, GitMerge, Sparkles, ShieldAlert } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CARD_TYPES } from '../../utils/constants'

// Cada tipo con su acento de color e icono temático
const TYPE_META = {
  'Normal Monster':  { color: 'from-yellow-700/40 to-yellow-500/20', border: 'border-yellow-600/40', active: 'bg-yellow-500/20 border-yellow-400/60 text-yellow-300', icon: Star },
  'Effect Monster':  { color: 'from-orange-700/40 to-orange-500/20', border: 'border-orange-600/40', active: 'bg-orange-500/20 border-orange-400/60 text-orange-300', icon: Zap },
  'Ritual':          { color: 'from-blue-700/40 to-blue-500/20',   border: 'border-blue-600/40',   active: 'bg-blue-500/20 border-blue-400/60 text-blue-300',   icon: Sparkles },
  'Fusion Monster':  { color: 'from-purple-700/40 to-purple-500/20', border: 'border-purple-600/40', active: 'bg-purple-500/20 border-purple-400/60 text-purple-300', icon: GitMerge },
  'Synchro Monster': { color: 'from-slate-600/40 to-slate-400/20', border: 'border-slate-500/40', active: 'bg-slate-500/20 border-slate-300/60 text-slate-200',  icon: Sword },
  'XYZ Monster':     { color: 'from-gray-800/60 to-gray-600/20',   border: 'border-gray-500/40',   active: 'bg-gray-700/40 border-gray-300/50 text-gray-200',    icon: Layers },
  'Link Monster':    { color: 'from-sky-700/40 to-sky-500/20',     border: 'border-sky-600/40',     active: 'bg-sky-500/20 border-sky-400/60 text-sky-300',       icon: Link2 },
  'Pendulum':        { color: 'from-teal-700/40 to-purple-700/20', border: 'border-teal-600/40',  active: 'bg-teal-500/20 border-teal-400/60 text-teal-300',    icon: Layers },
  'Spell Card':      { color: 'from-teal-800/40 to-teal-600/20',   border: 'border-teal-700/40',   active: 'bg-teal-600/20 border-teal-400/60 text-teal-300',    icon: Scroll },
  'Trap Card':       { color: 'from-pink-800/40 to-pink-600/20',   border: 'border-pink-700/40',   active: 'bg-pink-500/20 border-pink-400/60 text-pink-300',    icon: ShieldAlert },
}

export function FiltersPanel({ filters, onChange }) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const hasAdvancedFilters = filters.type || filters.archetype
  const hasAnyFilter = filters.name || hasAdvancedFilters

  function clearAll() {
    onChange({ name: '', type: '', archetype: '' })
    setShowAdvanced(false)
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Row 1: Buscador principal + botón filtros mobile */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1 group">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-amber-400 transition-colors pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar carta por nombre…"
            value={filters.name}
            onChange={(e) => onChange({ ...filters, name: e.target.value })}
            className="
              w-full bg-black/30 border border-white/8 rounded-xl text-slate-100 text-sm
              pl-10 pr-4 py-2.5 outline-none transition-all
              placeholder:text-slate-600
              focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 focus:bg-black/50
            "
          />
          {filters.name && (
            <button
              onClick={() => onChange({ ...filters, name: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Botón arquetipo inline — solo desktop */}
        <div className="relative hidden sm:block group">
          <input
            type="text"
            placeholder="Arquetipo…"
            value={filters.archetype}
            onChange={(e) => onChange({ ...filters, archetype: e.target.value })}
            className="
              w-44 bg-black/30 border border-white/8 rounded-xl text-slate-100 text-sm
              px-4 py-2.5 outline-none transition-all
              placeholder:text-slate-600
              focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 focus:bg-black/50
            "
          />
          {filters.archetype && (
            <button
              onClick={() => onChange({ ...filters, archetype: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Botón de filtros avanzados — mobile y desktop */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`p-2.5 rounded-xl border transition-all flex items-center justify-center relative ${
            showAdvanced || hasAdvancedFilters
              ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
              : 'bg-black/20 text-slate-400 border-white/5 hover:bg-white/5'
          }`}
          title={showAdvanced ? 'Ocultar filtros de tipo' : 'Mostrar filtros de tipo'}
        >
          <Filter size={18} />
          {hasAdvancedFilters && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />
          )}
        </button>

        {/* Limpiar filtros */}
        {hasAnyFilter && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={clearAll}
            className="p-2.5 rounded-xl border border-white/5 bg-black/20 text-slate-500 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all"
            title="Limpiar filtros"
          >
            <X size={18} />
          </motion.button>
        )}
      </div>

      {/* Row 2: Chips de tipo — colapsable en todas las pantallas */}
      <div className={`${showAdvanced ? 'flex' : 'hidden'} flex-col gap-3`}>
        {/* Arquetipo — solo mobile */}
        <div className="relative sm:hidden">
          <input
            type="text"
            placeholder="Arquetipo…"
            value={filters.archetype}
            onChange={(e) => onChange({ ...filters, archetype: e.target.value })}
            className="
              w-full bg-black/30 border border-white/8 rounded-xl text-slate-100 text-sm
              px-4 py-2.5 outline-none transition-all
              placeholder:text-slate-600
              focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10
            "
          />
          {filters.archetype && (
            <button
              onClick={() => onChange({ ...filters, archetype: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Type chips */}
        <div className="flex flex-wrap gap-2">
          {CARD_TYPES.map(({ label, value }) => {
            const meta = TYPE_META[value] ?? {}
            const Icon = meta.icon ?? Sword
            const isActive = filters.type === value
            return (
              <motion.button
                key={value}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onChange({ ...filters, type: isActive ? '' : value })}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium
                  transition-all duration-200 cursor-pointer
                  ${isActive
                    ? meta.active ?? 'bg-amber-500/20 border-amber-400/60 text-amber-300'
                    : `bg-black/30 border-white/8 text-slate-400 hover:border-white/20 hover:text-slate-200`
                  }
                `}
              >
                <Icon className="w-3 h-3 shrink-0" />
                {label}
                {isActive && (
                  <X className="w-3 h-3 ml-0.5 shrink-0" />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
