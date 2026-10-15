import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Ban,
  AlertTriangle,
  Zap,
  Search,
  Filter,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  LayoutGrid,
  List,
  CheckCircle2,
  X
} from 'lucide-react'
import { useBanlist } from '../../hooks/useBanlist'
import { SpotlightCard } from '../ui/SpotlightCard'
import { Badge } from '../ui/Badge'
import { ShinyText } from '../ui/ShinyText'

const CARDS_PER_PAGE = 18

const BAN_STATUS_TABS = [
  { id: 'forbidden', label: 'Prohibidas (0)', shortLabel: 'Prohibidas', icon: Ban, color: '#ef4444', badgeBg: 'bg-red-500/10', badgeBorder: 'border-red-500/30' },
  { id: 'limited', label: 'Limitadas (1)', shortLabel: 'Limitadas', icon: AlertTriangle, color: '#f59e0b', badgeBg: 'bg-amber-500/10', badgeBorder: 'border-amber-500/30' },
  { id: 'semi', label: 'Semi-Limitadas (2)', shortLabel: 'Semi', icon: Zap, color: '#0ea5e9', badgeBg: 'bg-sky-500/10', badgeBorder: 'border-sky-500/30' },
]

const TYPE_FILTERS = [
  { id: 'all', label: 'Todos los tipos' },
  { id: 'monster', label: 'Monstruos' },
  { id: 'spell', label: 'Mágicas' },
  { id: 'trap', label: 'Trampas' },
]

export function BanlistSection({ onSelectCard }) {
  const [activeTab, setActiveTab] = useState('forbidden')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [viewLayout, setViewLayout] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 'list' : 'grid'))

  const { cards, loading, error, refetch } = useBanlist('tcg')

  // Determinar el status de una carta en TCG
  const getCardStatus = (card) => {
    const raw = card.banlist_info?.ban_tcg

    if (!raw) return 'unknown'
    const lower = raw.toLowerCase()
    if (lower === 'forbidden' || lower === 'banned') return 'forbidden'
    if (lower.includes('semi')) return 'semi'
    if (lower === 'limited') return 'limited'
    return 'unknown'
  }

  // Contadores generales
  const counts = useMemo(() => {
    let forbidden = 0
    let limited = 0
    let semi = 0

    cards.forEach((c) => {
      const st = getCardStatus(c)
      if (st === 'forbidden') forbidden++
      else if (st === 'limited') limited++
      else if (st === 'semi') semi++
    })

    return {
      all: cards.length,
      forbidden,
      limited,
      semi,
    }
  }, [cards])

  // Filtrado de cartas
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const status = getCardStatus(card)

      // Filtro por Tab de Ban Status (Prohibidas, Limitadas, Semi)
      if (status !== activeTab) {
        return false
      }

      // Filtro por Búsqueda de Texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesName = card.name?.toLowerCase().includes(q)
        const matchesType = card.type?.toLowerCase().includes(q)
        const matchesRace = card.race?.toLowerCase().includes(q)
        if (!matchesName && !matchesType && !matchesRace) return false
      }

      // Filtro por Tipo de Carta
      if (typeFilter !== 'all') {
        const typeLower = (card.type || '').toLowerCase()
        if (typeFilter === 'monster' && !typeLower.includes('monster')) return false
        if (typeFilter === 'spell' && !typeLower.includes('spell')) return false
        if (typeFilter === 'trap' && !typeLower.includes('trap')) return false
      }

      return true
    })
  }, [cards, activeTab, searchQuery, typeFilter])

  // Reset de página al cambiar filtros
  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setCurrentPage(1)
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const handleTypeChange = (e) => {
    setTypeFilter(e.target.value)
    setCurrentPage(1)
  }

  // Paginación
  const totalPages = Math.ceil(filteredCards.length / CARDS_PER_PAGE) || 1
  const paginatedCards = useMemo(() => {
    const start = (currentPage - 1) * CARDS_PER_PAGE
    return filteredCards.slice(start, start + CARDS_PER_PAGE)
  }, [filteredCards, currentPage])

  // Formatear carta para abrir en CardDetailModal
  const handleCardClick = (card) => {
    if (!onSelectCard) return
    const mapped = {
      id: card.id,
      name: card.name,
      type: card.type,
      frameType: card.frameType || 'spell',
      desc: card.desc,
      race: card.race,
      atk: card.atk,
      def: card.def,
      level: card.level,
      attribute: card.attribute,
      archetype: card.archetype,
      image: card.card_images?.[0]?.image_url || `https://images.ygoprodeck.com/images/cards/${card.id}.jpg`,
      imageSmall: card.card_images?.[0]?.image_url_small || `https://images.ygoprodeck.com/images/cards_small/${card.id}.jpg`,
      card_sets: (card.card_sets || []).map((s) => ({
        setName: s.set_name,
        setCode: s.set_code,
        rarity: s.set_rarity,
        marketPrice: s.set_price,
      })),
      banlist_info: card.banlist_info,
    }
    onSelectCard(mapped)
  }

  return (
    <section id="banlist" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-14 scroll-mt-20">
      {/* ── Encabezado de la Sección ─────────────────────────────────── */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold mb-3 tracking-wider uppercase backdrop-blur-md shadow-[0_0_20px_rgba(239,68,68,0.15)]">
          <ShieldAlert className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          <ShinyText text="Regulaciones Oficiales TCG" color="#f87171" shineColor="#fee2e2" speed={3} />
        </div>

        <h2 className="font-display text-2xl sm:text-4xl font-bold text-white tracking-wide mb-3">
          LISTA DE CARTAS BANEADAS Y LIMITADAS
        </h2>

        <p className="text-slate-400 text-xs sm:text-sm max-w-2xl font-ui leading-relaxed">
          Consulta el estado competitivo oficial de cartas prohibidas y restringidas para torneos TCG.
          Sincronizado en tiempo real con la base de datos de Yu-Gi-Oh!.
        </p>
      </div>

      {/* ── Barra Superior: Formatos & Acciones ──────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-3 sm:p-4 rounded-2xl bg-[#0c1018]/90 border border-white/10 backdrop-blur-md">
        {/* Indicador de Formato y Enlace a Formatos Retro */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
            TCG OFICIAL
          </span>
          <Link
            to="/formats"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:border-amber-500/30 text-xs font-semibold transition-all group"
          >
            <span>Formatos Retro (Goat / Edison)</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Buscador de carta y Tipo */}
        <div className="flex flex-1 sm:flex-initial items-center gap-2.5 w-full sm:w-auto">
          {/* Input de búsqueda */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Buscar por carta o tipo..."
              className="w-full pl-9 pr-8 py-1.5 bg-black/50 border border-white/10 focus:border-amber-500/50 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setCurrentPage(1)
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Select de tipo de carta */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={handleTypeChange}
              className="bg-black/50 border border-white/10 hover:border-white/20 text-slate-300 text-xs rounded-xl px-3 py-2 pr-7 focus:outline-none focus:border-amber-500/50 transition-colors cursor-pointer appearance-none"
            >
              {TYPE_FILTERS.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#0f1420] text-slate-200">
                  {t.label}
                </option>
              ))}
            </select>
            <Filter className="w-3 h-3 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Toggle de Visualización: Cuadrícula / Lista */}
          <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => setViewLayout('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewLayout === 'grid'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vista en Cuadrícula"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('list')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewLayout === 'list'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vista en Lista Minimalista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs de Clasificación (Prohibidas, Limitadas, Semi) ─── */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3 mb-6 sm:mb-8">
        {BAN_STATUS_TABS.map((tab) => {
          const active = activeTab === tab.id
          const tabCount = counts[tab.id] ?? 0
          const Icon = tab.icon

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center justify-between p-2 sm:p-3.5 rounded-xl border transition-all text-left cursor-pointer group min-w-0 ${
                active
                  ? 'bg-white/[0.08] border-white/30 shadow-[0_4px_20px_rgba(0,0,0,0.5)] scale-[1.01]'
                  : 'bg-[#0f1422]/60 hover:bg-[#151c2e]/70 border-white/5 hover:border-white/15'
              }`}
              style={{
                borderColor: active ? tab.color : undefined,
                boxShadow: active ? `0 0 20px ${tab.color}25` : undefined,
              }}
            >
              <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                <div
                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                  style={{
                    backgroundColor: `${tab.color}18`,
                    border: `1px solid ${tab.color}40`,
                  }}
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: tab.color }} />
                </div>
                <div className="min-w-0">
                  <span
                    className={`block text-[11px] sm:text-xs font-bold truncate transition-colors ${
                      active ? 'text-white' : 'text-slate-300'
                    }`}
                  >
                    <span className="sm:hidden">{tab.shortLabel}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </span>
                  <span className="hidden sm:block text-[10px] text-slate-500 font-mono truncate">
                    {tab.id === 'forbidden'
                      ? '0 copias'
                      : tab.id === 'limited'
                      ? '1 copia'
                      : '2 copias'}
                  </span>
                </div>
              </div>

              <span
                className="text-[10px] sm:text-xs font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 ml-1"
                style={{
                  backgroundColor: `${tab.color}15`,
                  color: tab.color,
                  border: `1px solid ${tab.color}30`,
                }}
              >
                {tabCount}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Contenido: Loading, Error, Grid o Vacío ──────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/5 bg-[#0e121d]/60 p-3 flex flex-col gap-2.5 animate-pulse"
            >
              <div className="w-full aspect-[2/3] bg-white/5 rounded-lg" />
              <div className="h-3 bg-white/10 rounded w-4/5" />
              <div className="h-2.5 bg-white/5 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center backdrop-blur-md">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <h3 className="text-white font-bold text-sm mb-1">No se pudo cargar la Banlist</h3>
          <p className="text-slate-400 text-xs mb-4">
            Hubo un problema al consultar el catálogo de YGOProdeck. Verifica tu conexión e intenta de nuevo.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold border border-red-500/40 transition-colors cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-[#0c101a]/50 p-12 text-center backdrop-blur-md">
          <Search className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-60" />
          <h3 className="text-white font-bold text-sm mb-1">No se encontraron cartas</h3>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            No hay cartas que coincidan con &ldquo;{searchQuery}&rdquo; en la categoría seleccionada.
          </p>
        </div>
      ) : (
        <>
          {viewLayout === 'grid' ? (
            /* Grid de cartas */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4 mb-8">
              {paginatedCards.map((card) => {
                const status = getCardStatus(card)
                const isForbidden = status === 'forbidden'
                const isLimited = status === 'limited'
                const isSemi = status === 'semi'

                const statusColor = isForbidden ? '#ef4444' : isLimited ? '#f59e0b' : '#0ea5e9'
                const statusLabel = isForbidden ? '0' : isLimited ? '1' : '2'
                const statusTitle = isForbidden ? 'Prohibida' : isLimited ? 'Limitada' : 'Semi-Limitada'

                const cardImage =
                  card.card_images?.[0]?.image_url_small ||
                  card.card_images?.[0]?.image_url ||
                  `https://images.ygoprodeck.com/images/cards_small/${card.id}.jpg`

                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => handleCardClick(card)}
                    className="group relative flex flex-col rounded-xl overflow-hidden border border-white/10 bg-[#0d121c]/90 hover:bg-[#131926] hover:border-white/25 transition-[border-color,background-color,transform,box-shadow] duration-200 cursor-pointer shadow-md hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:-translate-y-1"
                    style={{
                      boxShadow: `0 0 0 1px ${statusColor}15`,
                    }}
                  >
                    {/* Badge de estado flotante */}
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-md backdrop-blur-md font-mono text-[10px] font-bold shadow-md"
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        border: `1px solid ${statusColor}60`,
                        color: statusColor,
                      }}
                    >
                      {isForbidden ? (
                        <Ban className="w-2.5 h-2.5 text-red-400 stroke-[2.5]" />
                      ) : isLimited ? (
                        <AlertTriangle className="w-2.5 h-2.5 text-amber-400 stroke-[2.5]" />
                      ) : (
                        <Zap className="w-2.5 h-2.5 text-sky-400 stroke-[2.5]" />
                      )}
                      <span>{statusLabel}</span>
                    </div>

                    {/* Imagen de la carta */}
                    <div className="relative w-full aspect-[2/3] overflow-hidden bg-black/40 p-2 flex items-center justify-center">
                      <img
                        src={cardImage}
                        alt={card.name}
                        loading="lazy"
                        className="w-full h-full object-contain rounded transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = '/card-placeholder.png'
                        }}
                      />
                      {/* Glow sutil en hover */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle at center, ${statusColor}20 0%, transparent 70%)`,
                        }}
                      />
                    </div>

                    {/* Información básica */}
                    <div className="p-2.5 flex flex-col flex-1 justify-between bg-[#0a0e16]">
                      <div>
                        <h4 className="text-white text-xs font-bold font-heading line-clamp-1 group-hover:text-amber-400 transition-colors" title={card.name}>
                          {card.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {card.race ? `${card.race} / ` : ''}{card.type}
                        </p>
                      </div>

                      <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                        <span
                          className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: `${statusColor}15`,
                            color: statusColor,
                          }}
                        >
                          {statusTitle}
                        </span>
                        <span className="text-[10px] text-slate-500 group-hover:text-amber-300 transition-colors flex items-center gap-0.5">
                          Detalle
                          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            /* Lista Minimalista */
            <div className="flex flex-col gap-2 mb-8">
              {paginatedCards.map((card) => {
                const status = getCardStatus(card)
                const isForbidden = status === 'forbidden'
                const isLimited = status === 'limited'
                const isSemi = status === 'semi'

                const statusColor = isForbidden ? '#ef4444' : isLimited ? '#f59e0b' : '#0ea5e9'
                const statusLabel = isForbidden ? '0 Prohibida' : isLimited ? '1 Limitada' : '2 Semi'

                const cardImage =
                  card.card_images?.[0]?.image_url_small ||
                  card.card_images?.[0]?.image_url ||
                  `https://images.ygoprodeck.com/images/cards_small/${card.id}.jpg`

                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.12 }}
                    onClick={() => handleCardClick(card)}
                    className="group flex items-center gap-3 p-2 sm:p-2.5 rounded-xl border border-white/10 bg-[#0d121c]/80 hover:bg-[#141b2b] hover:border-white/20 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                    style={{
                      borderLeftWidth: '3px',
                      borderLeftColor: statusColor,
                    }}
                  >
                    {/* Miniatura compacta */}
                    <div className="w-10 h-14 sm:w-11 sm:h-16 shrink-0 rounded bg-black/40 overflow-hidden relative border border-white/10">
                      <img
                        src={cardImage}
                        alt={card.name}
                        loading="lazy"
                        className="w-full h-full object-contain transition-transform group-hover:scale-105"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = '/card-placeholder.png'
                        }}
                      />
                    </div>

                    {/* Info central */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-white text-xs sm:text-sm font-bold font-heading truncate group-hover:text-amber-400 transition-colors">
                          {card.name}
                        </h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-400 mt-0.5 font-ui">
                        <span>{card.type}</span>
                        {card.race && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span>{card.race}</span>
                          </>
                        )}
                        {card.level && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span className="text-amber-400 font-mono">★{card.level}</span>
                          </>
                        )}
                        {(card.atk !== undefined && card.atk !== null) && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span className="font-mono text-slate-300">
                              {card.atk}/{card.def}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Badge */}
                    <div className="shrink-0 flex items-center gap-2">
                      <span
                        className="text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1"
                        style={{
                          backgroundColor: `${statusColor}15`,
                          color: statusColor,
                          border: `1px solid ${statusColor}30`,
                        }}
                      >
                        {isForbidden ? (
                          <Ban className="w-2.5 h-2.5 text-red-400 stroke-[2.5]" />
                        ) : isLimited ? (
                          <AlertTriangle className="w-2.5 h-2.5 text-amber-400 stroke-[2.5]" />
                        ) : (
                          <Zap className="w-2.5 h-2.5 text-sky-400 stroke-[2.5]" />
                        )}
                        <span>{statusLabel}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all hidden sm:block" />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* ── Paginador Responsivo ──────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10 text-xs text-slate-400">
              <span className="font-mono text-[11px]">
                Mostrando{' '}
                <strong className="text-white">
                  {(currentPage - 1) * CARDS_PER_PAGE + 1} -{' '}
                  {Math.min(currentPage * CARDS_PER_PAGE, filteredCards.length)}
                </strong>{' '}
                de <strong className="text-white">{filteredCards.length}</strong> cartas
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="px-3 py-1 rounded-lg bg-black/40 border border-white/10 font-mono text-xs text-slate-300">
                  Página <span className="text-amber-400 font-bold">{currentPage}</span> / {totalPages}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  title="Página siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
