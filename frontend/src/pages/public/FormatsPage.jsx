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
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  Lock,
  ShieldCheck,
  X,
  BookOpen,
  Calendar,
  Sword,
  LayoutGrid,
  List
} from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { useBanlist } from '../../hooks/useBanlist'
import { useFormatCards } from '../../hooks/useFormatCards'
import { CardDetailModal } from '../../components/cards/CardDetailModal'
import { ShinyText } from '../../components/ui/ShinyText'
import { SpotlightCard } from '../../components/ui/SpotlightCard'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/logo.webp'

const CARDS_PER_PAGE = 24

const FORMAT_CONFIGS = [
  {
    id: 'goat',
    name: 'Goat Format',
    subtitle: 'Verano 2005 (Corte: The Lost Millennium)',
    icon: '🐐',
    color: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.25)',
    desc: 'El formato retro más icónico y estratégico de Yu-Gi-Oh!. Sin cartas de Sincronía ni XYZ; duelos basados en administración de recursos y el impacto de cartas como Delinquent Duo, BLS y Scapegoat.',
    banlistKey: 'goat',
    hasBanlist: true,
  },
  {
    id: 'edison',
    name: 'Edison Format',
    subtitle: 'Abril 2010 (SJC Edison / Era 5D\'s)',
    icon: '⚡',
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.25)',
    desc: 'La era dorada de los Monstruos de Sincronía. Formato diverso y balanceado protagonizado por Quickdraw Dandy, Blackwing, Machina Gadget, Gladiator Beast y Frog Monarch.',
    banlistKey: 'tcg', // Edison usa reglas históricas de 2010
    hasBanlist: false,
  },
  {
    id: 'speed duel',
    name: 'Speed Duel',
    subtitle: 'Formato Rápido & Habilidades',
    icon: '⏱️',
    color: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.25)',
    desc: 'Versión dinámica con tableros de 3 zonas y cartas de habilidad de personajes clásicos. Pool seleccionado de cartas retro adaptadas para duelos directos.',
    banlistKey: null,
    hasBanlist: false,
  },
]

const TYPE_FILTERS = [
  { id: 'all', label: 'Todos los tipos' },
  { id: 'monster', label: 'Monstruos' },
  { id: 'spell', label: 'Mágicas' },
  { id: 'trap', label: 'Trampas' },
]

export default function FormatsPage() {
  const { user } = useAuth()
  const [selectedFormatId, setSelectedFormatId] = useState('goat')
  const [viewMode, setViewMode] = useState('pool') // 'pool' (todas las cartas legales) o 'banlist' (restringidas)
  const [banStatusFilter, setBanStatusFilter] = useState('all') // 'all', 'forbidden', 'limited', 'semi'
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [detailCard, setDetailCard] = useState(null)
  const [viewLayout, setViewLayout] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 'list' : 'grid'))

  const currentFormat = FORMAT_CONFIGS.find((f) => f.id === selectedFormatId) || FORMAT_CONFIGS[0]

  // Consultar card pool completo del formato
  const { cards: poolCards, loading: loadingPool, error: errorPool, refetch: refetchPool } = useFormatCards(selectedFormatId)

  // Consultar banlist del formato (si aplica)
  const { cards: banlistCards, loading: loadingBanlist, error: errorBanlist, refetch: refetchBanlist } = useBanlist(
    currentFormat.banlistKey || 'tcg'
  )

  // Determinar estatus de una carta en el formato actual
  const getCardBanStatus = (card) => {
    let raw = null
    if (selectedFormatId === 'goat') {
      raw = card.banlist_info?.ban_goat
    } else {
      raw = card.banlist_info?.ban_tcg
    }

    if (!raw) return 'unlimited'
    const lower = raw.toLowerCase()
    if (lower === 'forbidden' || lower === 'banned') return 'forbidden'
    if (lower.includes('semi')) return 'semi'
    if (lower === 'limited') return 'limited'
    return 'unlimited'
  }

  // Lista base según el modo seleccionado
  const baseCards = viewMode === 'banlist' ? banlistCards : poolCards
  const isLoading = viewMode === 'banlist' ? loadingBanlist : loadingPool
  const isError = viewMode === 'banlist' ? errorBanlist : errorPool
  const refetch = viewMode === 'banlist' ? refetchBanlist : refetchPool

  // Contadores del formato
  const counts = useMemo(() => {
    let forbidden = 0
    let limited = 0
    let semi = 0

    poolCards.forEach((c) => {
      const st = getCardBanStatus(c)
      if (st === 'forbidden') forbidden++
      else if (st === 'limited') limited++
      else if (st === 'semi') semi++
    })

    return {
      totalPool: poolCards.length,
      forbidden,
      limited,
      semi,
      unlimited: Math.max(0, poolCards.length - (forbidden + limited + semi)),
    }
  }, [poolCards, selectedFormatId])

  // Filtrado de cartas
  const filteredCards = useMemo(() => {
    return baseCards.filter((card) => {
      const status = getCardBanStatus(card)

      // Filtro de Ban Status
      if (banStatusFilter !== 'all') {
        if (banStatusFilter === 'forbidden' && status !== 'forbidden') return false
        if (banStatusFilter === 'limited' && status !== 'limited') return false
        if (banStatusFilter === 'semi' && status !== 'semi') return false
        if (banStatusFilter === 'unlimited' && status !== 'unlimited') return false
      }

      // Filtro por Búsqueda de Texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesName = card.name?.toLowerCase().includes(q)
        const matchesType = card.type?.toLowerCase().includes(q)
        const matchesRace = card.race?.toLowerCase().includes(q)
        const matchesDesc = card.desc?.toLowerCase().includes(q)
        if (!matchesName && !matchesType && !matchesRace && !matchesDesc) return false
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
  }, [baseCards, banStatusFilter, searchQuery, typeFilter, selectedFormatId])

  // Reset de página al cambiar filtros
  const handleFormatSelect = (id) => {
    setSelectedFormatId(id)
    setCurrentPage(1)
    setBanStatusFilter('all')
  }

  const handleViewModeSelect = (mode) => {
    setViewMode(mode)
    setCurrentPage(1)
    setBanStatusFilter('all')
  }

  // Paginación
  const totalPages = Math.ceil(filteredCards.length / CARDS_PER_PAGE) || 1
  const paginatedCards = useMemo(() => {
    const start = (currentPage - 1) * CARDS_PER_PAGE
    return filteredCards.slice(start, start + CARDS_PER_PAGE)
  }, [filteredCards, currentPage])

  // Abrir detalle
  const handleCardClick = (card) => {
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
    setDetailCard(mapped)
  }

  return (
    <>
      <Helmet>
        <title>Formatos Yu-Gi-Oh! (Goat, Edison & TCG) | Lista de Cartas y Banlist</title>
        <meta
          name="description"
          content="Explora las cartas legales y la banlist de formatos clásicos y competitivos de Yu-Gi-Oh!: Goat Format (2005), Edison (2010), TCG y Speed Duel."
        />
      </Helmet>

      <div className="relative min-h-screen bg-[#080a11] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black overflow-x-hidden">
        {/* ── Fondo Retro Legendario & Textura Milenaria ──────────────── */}
        <div className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0">
          {/* Arte de Monstruos Legendarios Clásicos (Ojos Azules, Mago Oscuro, Ojos Rojos) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src="/hero-yugioh.webp"
              alt="Yu-Gi-Oh! Retro Classics"
              className="w-full h-full object-cover object-top opacity-60 filter saturate-150 contrast-110 scale-105"
            />
          </div>

          {/* Textura de Jeroglíficos y Artículos Milenarios */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay"
            style={{
              backgroundImage: "url('/2.webp')",
              backgroundSize: "320px",
              backgroundRepeat: "repeat"
            }}
          />

          {/* Fundidos suaves: superior tras el navbar e inferior para legibilidad */}
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#080a11] via-[#080a11]/70 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-96 bg-gradient-to-t from-[#080a11] via-[#080a11]/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080a11]/70 via-transparent to-[#080a11]/70" />

          {/* Tinte oscuro ambiental suave para no competir con el contenido */}
          <div className="absolute inset-0 bg-[#080a11]/40" />

          {/* Luces mágicas ambientales retro (Oro Milenario y Púrpura de las Sombras) */}
          <div className="absolute top-1/4 left-1/4 w-[450px] h-[350px] bg-amber-500/20 blur-[120px] rounded-full" />
          <div className="absolute top-1/3 -right-10 w-[450px] h-[450px] bg-purple-600/20 blur-[130px] rounded-full" />
          <div className="absolute bottom-20 -left-10 w-[450px] h-[450px] bg-sky-500/15 blur-[120px] rounded-full" />
        </div>

        {/* ── Navbar ──────────────────────────────────────────────────── */}
        <header className="relative z-40 w-full border-b border-white/5 bg-[#080a11]/85 backdrop-blur-md sticky top-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2 group">
              <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-amber-400 group-hover:-translate-x-1 transition-all" />
              <img src={logo} alt="Yu-Gi-Oh!" className="h-7 w-auto object-contain" />
              <span className="text-xs font-bold text-slate-300 font-heading tracking-wider hidden sm:inline">
                Inicio
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors"
              >
                Home
              </Link>
              {user ? (
                <Link
                  to="/admin/search"
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-all"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Panel Admin</span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 transition-all"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Acceder</span>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* ── Main Content ────────────────────────────────────────────── */}
        <main className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 w-full">
          {/* Hero Header */}
          <div className="text-center max-w-3xl mx-auto mb-4 sm:mb-10">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] sm:text-xs font-semibold mb-2 sm:mb-4 tracking-wider uppercase backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.15)]">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
              <ShinyText text="Explorador de Formatos Retro & Eras Clásicas" color="#fbbf24" shineColor="#fffbeb" speed={3} />
            </div>

            <h1 className="font-display text-2xl sm:text-5xl font-bold text-white tracking-wide mb-1.5 sm:mb-3">
              FORMATOS RETRO DE YU-GI-OH!
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-ui max-w-2xl mx-auto hidden sm:block">
              Descubre las cartas permitidas, las listas de prohibidas y limitadas, y el card pool oficial
              de los formatos retro más legendarios como <strong>Goat Format (2005)</strong> y <strong>Edison (2010)</strong>.
            </p>
          </div>

          {/* ── Selector de Formatos (Una fila en móvil y 3 columnas en desktop) ── */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-4 mb-4 sm:mb-10">
            {FORMAT_CONFIGS.map((f) => {
              const active = selectedFormatId === f.id
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleFormatSelect(f.id)}
                  className={`text-center sm:text-left p-2 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                    active
                      ? 'bg-[#101625]/90 border-white/30 shadow-[0_8px_30px_rgba(0,0,0,0.6)] scale-[1.01] sm:scale-[1.02]'
                      : 'bg-[#0d121c]/70 hover:bg-[#131926] border-white/5 hover:border-white/20'
                  }`}
                  style={{
                    borderColor: active ? f.color : undefined,
                    boxShadow: active ? `0 0 25px ${f.glow}` : undefined,
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1 sm:mb-2">
                    <span className="text-lg sm:text-2xl">{f.icon}</span>
                    <span
                      className="text-[8px] sm:text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full inline-block sm:inline"
                      style={{
                        backgroundColor: `${f.color}15`,
                        color: f.color,
                        border: `1px solid ${f.color}40`,
                      }}
                    >
                      {active ? 'Activo' : 'Elegir'}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-base font-bold text-white font-heading group-hover:text-amber-400 transition-colors truncate">
                    {f.name}
                  </h3>
                  <p className="text-[9px] sm:text-[11px] text-slate-400 font-mono mt-0.5 mb-0.5 sm:mb-2 truncate hidden xs:block sm:block">
                    {f.subtitle}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed hidden sm:block">
                    {f.desc}
                  </p>
                </button>
              )
            })}
          </div>

          {/* ── Panel de Control del Formato Seleccionado ──────────────── */}
          <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-[#0c101a]/90 p-3 sm:p-6 mb-4 sm:mb-8 backdrop-blur-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-5 pb-3 sm:pb-5 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2 sm:gap-2.5 mb-0.5 sm:mb-1">
                  <span className="text-xl sm:text-2xl">{currentFormat.icon}</span>
                  <h2 className="text-sm sm:text-xl font-bold text-white font-heading">
                    {currentFormat.name}
                  </h2>
                  <span
                    className="text-[10px] sm:text-xs font-mono font-bold px-2 sm:px-2.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${currentFormat.color}15`,
                      color: currentFormat.color,
                      border: `1px solid ${currentFormat.color}40`,
                    }}
                  >
                    {counts.totalPool > 0 ? `${counts.totalPool} cartas` : '...'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-ui max-w-xl hidden sm:block">
                  {currentFormat.desc}
                </p>
              </div>

              {/* Botones de Modo: Card Pool Completo vs Banlist Restringida */}
              <div className="flex items-center gap-1.5 sm:gap-2 bg-black/50 p-1 rounded-xl border border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={() => handleViewModeSelect('pool')}
                  className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                    viewMode === 'pool'
                      ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Pool ({counts.totalPool})</span>
                </button>

                {currentFormat.hasBanlist && (
                  <button
                    type="button"
                    onClick={() => handleViewModeSelect('banlist')}
                    className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                      viewMode === 'banlist'
                        ? 'bg-red-500 text-white font-extrabold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Banlist ({counts.forbidden + counts.limited + counts.semi})</span>
                  </button>
                )}
              </div>
            </div>

            {/* ── Filtros y Buscador ───────────────────────────────────── */}
            <div className="pt-3 sm:pt-5 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
              {/* Filtro por estado de ban: En mobile en una fila deslizable única; en desktop flex-wrap espacioso como antes */}
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto sm:overflow-visible no-scrollbar py-0.5 max-w-full whitespace-nowrap sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setBanStatusFilter('all')
                    setCurrentPage(1)
                  }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    banStatusFilter === 'all'
                      ? 'bg-white/15 text-white border border-white/30'
                      : 'text-slate-400 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  Todas ({viewMode === 'banlist' ? baseCards.length : counts.totalPool})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBanStatusFilter('forbidden')
                    setCurrentPage(1)
                  }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                    banStatusFilter === 'forbidden'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                      : 'text-slate-400 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Ban className="w-3 h-3 text-red-400" />
                  <span>Prohibidas ({counts.forbidden})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBanStatusFilter('limited')
                    setCurrentPage(1)
                  }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                    banStatusFilter === 'limited'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                      : 'text-slate-400 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>Limitadas ({counts.limited})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBanStatusFilter('semi')
                    setCurrentPage(1)
                  }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                    banStatusFilter === 'semi'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-[0_0_10px_rgba(14,165,233,0.2)]'
                      : 'text-slate-400 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Zap className="w-3 h-3 text-sky-400" />
                  <span>Semi ({counts.semi})</span>
                </button>

                {viewMode === 'pool' && (
                  <button
                    type="button"
                    onClick={() => {
                      setBanStatusFilter('unlimited')
                      setCurrentPage(1)
                    }}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                      banStatusFilter === 'unlimited'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        : 'text-slate-400 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Ilimitadas ({counts.unlimited})</span>
                  </button>
                )}
              </div>

              {/* Búsqueda, tipo y toggle de vista */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-60">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    placeholder="Buscar carta en este formato..."
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

                <div className="relative">
                  <select
                    value={typeFilter}
                    onChange={(e) => {
                      setTypeFilter(e.target.value)
                      setCurrentPage(1)
                    }}
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
          </div>

          {/* ── Grid de Cartas ────────────────────────────────────────── */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 18 }).map((_, i) => (
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
          ) : isError ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-10 text-center backdrop-blur-md">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <h3 className="text-white font-bold text-sm mb-1">Error al consultar el catálogo</h3>
              <p className="text-slate-400 text-xs mb-4">
                No se pudieron descargar las cartas del formato {currentFormat.name}.
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
                No hay resultados con los filtros actuales para {currentFormat.name}.
              </p>
            </div>
          ) : (
            <>
              {viewLayout === 'grid' ? (
                /* ── Vista en Cuadrícula ── */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4 mb-8">
                  {paginatedCards.map((card) => {
                    const status = getCardBanStatus(card)
                    const isForbidden = status === 'forbidden'
                    const isLimited = status === 'limited'
                    const isSemi = status === 'semi'

                    const statusColor = isForbidden
                      ? '#ef4444'
                      : isLimited
                      ? '#f59e0b'
                      : isSemi
                      ? '#0ea5e9'
                      : '#10b981'

                    const statusLabel = isForbidden
                      ? '0 Prohibida'
                      : isLimited
                      ? '1 Limitada'
                      : isSemi
                      ? '2 Semi'
                      : 'x3 Permitida'

                    const cardImage =
                      card.card_images?.[0]?.image_url_small ||
                      card.card_images?.[0]?.image_url ||
                      `https://images.ygoprodeck.com/images/cards_small/${card.id}.jpg`

                    return (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => handleCardClick(card)}
                        className="group relative flex flex-col rounded-xl overflow-hidden border border-white/10 bg-[#0d121c]/90 hover:bg-[#131926] hover:border-white/25 transition-[border-color,background-color,transform,box-shadow] duration-200 cursor-pointer shadow-md hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:-translate-y-1"
                        style={{
                          boxShadow: `0 0 0 1px ${statusColor}15`,
                        }}
                      >
                        {/* Badge flotante */}
                        <div
                          className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-md backdrop-blur-md font-mono text-[9px] font-bold shadow-md"
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
                          ) : isSemi ? (
                            <Zap className="w-2.5 h-2.5 text-sky-400 stroke-[2.5]" />
                          ) : (
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 stroke-[2.5]" />
                          )}
                          <span>{statusLabel}</span>
                        </div>

                        {/* Imagen */}
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
                          <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                            style={{
                              background: `radial-gradient(circle at center, ${statusColor}20 0%, transparent 70%)`,
                            }}
                          />
                        </div>

                        {/* Info */}
                        <div className="p-2.5 flex flex-col flex-1 justify-between bg-[#0a0e16]">
                          <div>
                            <h4
                              className="text-white text-xs font-bold font-heading line-clamp-1 group-hover:text-amber-400 transition-colors"
                              title={card.name}
                            >
                              {card.name}
                            </h4>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {card.race ? `${card.race} / ` : ''}
                              {card.type}
                            </p>
                          </div>

                          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
                            <span className="font-mono">
                              {card.level ? `Nvl ${card.level}` : card.race || 'Carta'}
                            </span>
                            <span className="group-hover:text-amber-300 transition-colors flex items-center">
                              Ver
                              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                /* ── Vista en Lista Minimalista ── */
                <div className="flex flex-col gap-2 mb-8">
                  {paginatedCards.map((card) => {
                    const status = getCardBanStatus(card)
                    const isForbidden = status === 'forbidden'
                    const isLimited = status === 'limited'
                    const isSemi = status === 'semi'

                    const statusColor = isForbidden
                      ? '#ef4444'
                      : isLimited
                      ? '#f59e0b'
                      : isSemi
                      ? '#0ea5e9'
                      : '#10b981'

                    const statusLabel = isForbidden
                      ? '0 Prohibida'
                      : isLimited
                      ? '1 Limitada'
                      : isSemi
                      ? '2 Semi'
                      : 'x3 Permitida'

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

                        {/* Badge y acción */}
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
                            ) : isSemi ? (
                              <Zap className="w-2.5 h-2.5 text-sky-400 stroke-[2.5]" />
                            ) : (
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 stroke-[2.5]" />
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

              {/* Paginación */}
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
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* Modal de Detalle Completo de Carta */}
        {detailCard && (
          <CardDetailModal
            card={detailCard}
            onClose={() => setDetailCard(null)}
            isPublic={false}
            isCatalog={true}
          />
        )}
      </div>
    </>
  )
}
