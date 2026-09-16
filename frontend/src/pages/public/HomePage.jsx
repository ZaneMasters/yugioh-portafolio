import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Layers,
  Heart,
  FolderOpen,
  ArrowRight,
  Lock,
  Sparkles,
  Users,
  Tag,
  X,
  CheckCircle2,
  ShieldCheck,
  ShoppingCart,
  MessageCircle,
  Database,
  ChevronRight,
  Flame
} from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { usePublicUsers } from '../../hooks/usePublicUsers'
import { useSearchBySet } from '../../hooks/useSearchBySet'
import { CardDetailModal } from '../../components/cards/CardDetailModal'
import logo from '../../assets/logo.webp'

const POPULAR_SET_CODES = [
  'AMDE-EN046',
  'MP24-EN001',
  'MAMA-EN066',
  'MAGO-EN035',
  'PHHY-EN091',
  'LOB-001',
]

const FEATURES = [
  {
    icon: Layers,
    tag: 'Control Total',
    title: 'Inventario & Valuación',
    desc: 'Registra cada carta con su condición (NM, LP, MP), rareza exacta y carpetas temáticas con valuación de mercado automática.',
    color: '#fbbf24',
    borderGlow: 'rgba(251, 191, 36, 0.25)',
  },
  {
    icon: Tag,
    tag: 'Filtro Preciso',
    title: 'Buscador por Set Code',
    desc: 'Localiza impresiones específicas al instante y comprueba qué jugadores de la comunidad tienen copias disponibles para trato.',
    color: '#38bdf8',
    borderGlow: 'rgba(56, 189, 248, 0.25)',
  },
  {
    icon: ShoppingCart,
    tag: 'Trato Directo',
    title: 'Portafolio & WhatsApp',
    desc: 'Tu vitrina personalizada para compartir. Los interesados seleccionan cartas en un carrito y te envían el pedido listo a tu WhatsApp.',
    color: '#34d399',
    borderGlow: 'rgba(52, 211, 153, 0.25)',
  },
]

export default function HomePage() {
  const [setCodeInput, setSetCodeInput] = useState('')
  const [activeSetQuery, setActiveSetQuery] = useState('')
  const [error, setError] = useState('')
  const [detailCard, setDetailCard] = useState(null)
  const navigate = useNavigate()

  const { users, loading: loadingUsers } = usePublicUsers()
  const { cards: searchResults, loading: loadingSearch } = useSearchBySet(activeSetQuery)

  const handleSearch = (e) => {
    e?.preventDefault()
    const clean = setCodeInput.trim()
    if (!clean) {
      setError('Ingresa un código de set (ej: LOB-001, MP24-EN001).')
      return
    }
    if (clean.length < 2) {
      setError('El código debe tener al menos 2 caracteres.')
      return
    }
    setError('')
    setActiveSetQuery(clean)
  }

  const handleSelectExample = (code) => {
    setSetCodeInput(code)
    setError('')
    setActiveSetQuery(code)
  }

  const handleClearSearch = () => {
    setSetCodeInput('')
    setActiveSetQuery('')
    setError('')
  }

  return (
    <>
      <Helmet>
        <title>Yu-Gi-Oh! Inventory — El Templo del Duelista</title>
        <meta
          name="description"
          content="Plataforma de coleccionistas de Yu-Gi-Oh!. Busca cartas por Set Code exacto, explora inventarios de la comunidad y gestiona tu colección."
        />
      </Helmet>

      <div className="min-h-screen bg-[#080a11] text-slate-100 flex flex-col relative overflow-x-hidden">

        {/* ── Navbar ─────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#080a11]/85 border-b border-white/5 transition-all">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            {/* Logo oficial */}
            <a href="/" className="flex items-center gap-3 group">
              <img
                src={logo}
                alt="Yu-Gi-Oh! TCG"
                className="h-8 sm:h-9 w-auto object-contain drop-shadow-[0_0_12px_rgba(245,158,11,0.25)] transition-transform duration-200 group-hover:scale-105"
              />
              <div className="hidden sm:flex flex-col">
                <span className="text-[10px] font-mono tracking-widest text-amber-400 font-bold uppercase">
                  TCG Vault & Bazar
                </span>
                <span className="text-xs font-bold text-slate-300 -mt-1 font-heading tracking-wider">
                  Inventory
                </span>
              </div>
            </a>

            {/* Acciones y Enlaces */}
            <nav className="flex items-center gap-3 sm:gap-6">
              <a
                href="#buscador"
                className="text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors hidden md:inline-flex items-center gap-1"
              >
                <Search className="w-3.5 h-3.5" />
                Buscador Set Code
              </a>
              <a
                href="#coleccionistas"
                className="text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors hidden sm:inline-flex items-center gap-1"
              >
                <Users className="w-3.5 h-3.5" />
                Coleccionistas
              </a>
              <a
                href="/login"
                className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-all shadow-[0_0_15px_rgba(245,158,11,0.08)] hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] active:scale-95"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Panel Admin</span>
              </a>
            </nav>
          </div>
        </header>

        {/* ── Hero Section con Arte Legendario Vivo ──────────────────── */}
        <section className="relative pt-10 pb-20 sm:pt-14 sm:pb-28 px-4 flex flex-col items-center justify-center overflow-hidden">
          
          {/* Fondo de Arte: Monstruos Legendarios (Ojos Azules, Mago Oscuro, Ojos Rojos) */}
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex items-center justify-center">
            <img
              src="/hero-yugioh.webp"
              alt="Yu-Gi-Oh! Legendaries"
              className="w-full max-w-5xl h-full object-cover object-center opacity-45 filter saturate-150 contrast-110 drop-shadow-[0_0_50px_rgba(245,158,11,0.2)]"
            />
            {/* Gradientes sutiles para fundir bordes sin apagar la imagen */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#080a11] via-[#080a11]/60 to-[#080a11]/70" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#080a11] via-transparent to-[#080a11]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_#080a11_85%)]" />
            
            {/* Luces mágicas (Azul relámpago izquierda, Púrpura centro, Fuego ámbar derecha) */}
            <div className="absolute top-1/3 left-10 w-72 h-72 bg-sky-500/15 blur-[90px] rounded-full" />
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-purple-500/15 blur-[100px] rounded-full" />
            <div className="absolute top-1/3 right-10 w-72 h-72 bg-amber-500/15 blur-[90px] rounded-full" />
          </div>

          <div className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center">
            
            {/* Badge místico */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-amber-500/40 text-amber-300 text-xs font-semibold mb-6 tracking-wider uppercase backdrop-blur-md shadow-[0_0_25px_rgba(245,158,11,0.2)]"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Plataforma Oficial de Coleccionistas & TCG</span>
            </motion.div>

            {/* Título Principal */}
            <motion.h1
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="font-display text-3xl xs:text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-3 sm:mb-4 leading-[1.1] drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] px-1"
            >
              EL TEMPLO DEL <br className="hidden sm:inline" />
              <span className="text-gradient drop-shadow-[0_4px_35px_rgba(245,158,11,0.45)]">
                DUELISTA
              </span>
            </motion.h1>

            {/* Subtítulo */}
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16 }}
              className="font-ui text-sm sm:text-lg md:text-xl text-slate-200 max-w-2xl leading-relaxed mb-6 sm:mb-8 font-medium drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] px-2"
            >
              Gestiona tu inventario con precios en tiempo real, localiza cartas por su{' '}
              <span className="text-amber-400 font-semibold font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 whitespace-nowrap">
                Código de Set
              </span>{' '}
              y descubre quién las tiene en la comunidad.
            </motion.p>

            {/* ── Buscador por Set Code ("Millennium Scanner") ─────────── */}
            <motion.div
              id="buscador"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.22 }}
              className="w-full max-w-xl px-1"
            >
              <form onSubmit={handleSearch} className="relative group">
                {/* Borde con degradado iluminado */}
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-amber-500/40 via-yellow-500/20 to-purple-500/40 opacity-70 blur-sm group-hover:opacity-100 transition duration-300" />
                
                <div className="relative flex items-center bg-[#0c101a]/95 backdrop-blur-xl rounded-2xl border border-amber-500/30 p-1 sm:p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.8)]">
                  {/* Tag prefix */}
                  <div className="shrink-0 px-2 sm:px-3.5 py-1.5 sm:py-2 flex items-center gap-1 text-amber-400 text-[11px] sm:text-xs font-mono font-bold select-none border-r border-white/10">
                    <Tag className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                    <span>SET:</span>
                  </div>

                  {/* Input de Set Code */}
                  <input
                    type="text"
                    value={setCodeInput}
                    onChange={(e) => {
                      setSetCodeInput(e.target.value.toUpperCase())
                      setError('')
                    }}
                    placeholder="Ej: AMDE-EN046, MP24-EN001..."
                    autoComplete="off"
                    spellCheck={false}
                    className="flex-1 bg-transparent text-amber-300 font-mono font-bold text-xs sm:text-base px-2 sm:px-3 py-1.5 sm:py-2 outline-none placeholder:text-slate-600 placeholder:font-sans placeholder:font-normal min-w-0"
                  />

                  {/* Botón limpiar si hay texto */}
                  {setCodeInput && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="p-1 sm:p-2 text-slate-500 hover:text-white transition-colors cursor-pointer mr-0.5"
                      title="Limpiar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Botón de búsqueda */}
                  <button
                    type="submit"
                    className="shrink-0 flex items-center gap-1 sm:gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-95 text-black text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                  >
                    <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Buscar</span>
                  </button>
                </div>
              </form>

              {error && (
                <p className="text-xs text-rose-400 mt-2 font-medium text-left ml-2">
                  {error}
                </p>
              )}

              {/* Chips con Set Codes de ejemplo */}
              <div className="mt-3.5 flex items-center gap-1.5 flex-wrap justify-center">
                <span className="text-[11px] text-slate-500 font-medium">Ejemplos rápidos:</span>
                {POPULAR_SET_CODES.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleSelectExample(code)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-mono text-[11px] transition-all cursor-pointer ${
                      activeSetQuery.toUpperCase() === code.toUpperCase()
                        ? 'bg-amber-500 text-black font-bold shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                        : 'bg-white/[0.04] hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/40 text-slate-300 hover:text-amber-300'
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Métricas rápidas / Badges de plataforma */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-10 flex items-center justify-center gap-4 sm:gap-8 flex-wrap text-xs text-slate-400"
            >
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/5">
                <Database className="w-3.5 h-3.5 text-amber-400" />
                <span><strong className="text-white font-mono">+14,000</strong> Cartas TCG</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/5">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span><strong className="text-white font-mono">{users.length}</strong> Coleccionistas</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/5">
                <Tag className="w-3.5 h-3.5 text-sky-400" />
                <span>Búsqueda por Set Code</span>
              </div>
            </motion.div>

          </div>
        </section>

        {/* ── Sección de Resultados de Búsqueda ───────────────────────── */}
        <AnimatePresence>
          {activeSetQuery && (
            <section className="w-full max-w-4xl mx-auto px-3 sm:px-4 mb-12 sm:mb-16">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="relative rounded-2xl bg-[#0d121c]/95 border border-amber-500/30 p-3.5 sm:p-6 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.7),0_0_30px_rgba(245,158,11,0.08)]"
              >
                {/* Header de resultados responsive */}
                <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-white/10">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <div className="p-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                      <Tag className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs sm:text-sm text-slate-300 font-medium shrink-0">Set:</span>
                    <span className="font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-xs sm:text-sm truncate">
                      {activeSetQuery}
                    </span>
                    {!loadingSearch && (
                      <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-300 font-mono font-medium border border-white/10 shrink-0">
                        {searchResults.length} {searchResults.length === 1 ? 'carta' : 'cartas'}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleClearSearch}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/10 border border-white/5 transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cerrar</span>
                  </button>
                </div>

                {loadingSearch ? (
                  <div className="flex flex-col items-center justify-center py-10 sm:py-14 text-slate-400">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-3" />
                    <p className="text-xs sm:text-sm font-medium text-center px-4">
                      Buscando cartas con el código {activeSetQuery} en el catálogo...
                    </p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-8 sm:py-10 px-3">
                    <p className="text-slate-200 font-bold text-sm sm:text-base mb-1">
                      No se encontraron cartas con el Set Code "{activeSetQuery}"
                    </p>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      Asegúrate de escribir el código de expansión completo (ej: <span className="font-mono text-amber-400">AMDE-EN046</span>, <span className="font-mono text-amber-400">MP24-EN001</span> o <span className="font-mono text-amber-400">LOB-001</span>).
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5 sm:space-y-4">
                    {searchResults.map((card) => {
                      const matched = card.matchedSet
                      const tcgPrice = card.marketPrice || matched?.marketPrice
                      const lowPrice = card.lowPrice || matched?.lowPrice
                      const commPrice = card.minCommunityPrice

                      return (
                        <div
                          key={card.cardId || card.id}
                          className="flex flex-col p-3.5 sm:p-5 rounded-xl bg-black/40 border border-white/10 hover:border-amber-500/30 transition-all duration-200 gap-3"
                        >
                          {/* Fila superior: Imagen al lado de la información clave (mobile y desktop) */}
                          <div className="flex gap-3 sm:gap-5 items-start">
                            {/* Miniatura */}
                            <div
                              onClick={() => setDetailCard(card)}
                              className="w-20 sm:w-28 shrink-0 cursor-pointer group relative"
                              title="Haz clic para ver la carta completa"
                            >
                              <img
                                src={card.imageSmall || card.image}
                                alt={card.name}
                                className="w-full h-auto rounded-lg shadow-lg group-hover:scale-105 transition-transform duration-200"
                                onError={(e) => {
                                  e.target.onerror = null
                                  e.target.src = '/card-placeholder.png'
                                }}
                              />
                              <div className="absolute inset-0 rounded-lg bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </div>

                            {/* Datos de la carta */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1.5">
                                <h3
                                  onClick={() => setDetailCard(card)}
                                  className="font-heading text-base sm:text-lg font-bold text-white hover:text-amber-400 transition-colors cursor-pointer truncate"
                                >
                                  {card.name}
                                </h3>
                                {card.frameType && (
                                  <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 shrink-0">
                                    {card.type || card.frameType}
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                ID: {card.cardId || card.id} {card.archetype ? `• ${card.archetype}` : ''}
                              </p>

                              {/* Badges del Set Match */}
                              {matched && (
                                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[11px] sm:text-xs font-bold shadow-sm">
                                    <Tag className="w-3 h-3" />
                                    {matched.setCode}
                                  </span>
                                  {matched.rarity && (
                                    <span className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-[10px] sm:text-xs text-purple-300 font-semibold truncate max-w-[150px] sm:max-w-none">
                                      {matched.rarity}
                                    </span>
                                  )}
                                  {matched.setName && (
                                    <span className="text-[11px] sm:text-xs text-slate-400 font-medium truncate hidden md:inline max-w-xs">
                                      ({matched.setName})
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* ── BLOQUE DE PRECIOS DESTACADO ─────────── */}
                              <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                                {tcgPrice ? (
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/35 text-amber-300 shadow-sm">
                                    <span className="text-[9px] sm:text-[10px] uppercase font-mono font-bold tracking-wider text-amber-400/90">
                                      Precio TCG:
                                    </span>
                                    <span className="font-stat font-bold text-xs sm:text-sm text-amber-300">
                                      ${Number(tcgPrice).toFixed(2)} USD
                                    </span>
                                    {lowPrice && (
                                      <span className="text-[9px] sm:text-[10px] text-amber-300/70 font-mono hidden sm:inline">
                                        (Bajo: ${Number(lowPrice).toFixed(2)})
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 text-[10px] font-mono">
                                    <span>TCG: Sin precio en vivo</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Descripción de efecto */}
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed font-ui">
                            {card.desc}
                          </p>

                          {/* Disponibilidad con duelistas y acción */}
                          <div className="pt-2.5 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="min-w-0">
                              {card.communityOwners && card.communityOwners.length > 0 ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span>Disponible con:</span>
                                  </span>
                                  {card.communityOwners.map((owner) => (
                                    <button
                                      key={owner.id || owner.slug}
                                      type="button"
                                      onClick={() => navigate(`/portfolio/${owner.slug}`)}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/30 text-[11px] sm:text-xs font-medium text-emerald-300 transition-all cursor-pointer"
                                      title={`Ver portafolio de ${owner.displayName}`}
                                    >
                                      <span className="font-semibold">{owner.displayName}</span>
                                      <span className="font-mono text-emerald-400/90 text-[10px] sm:text-[11px]">
                                        ({owner.quantity}x{owner.price ? ` • $${owner.price}` : ''})
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[11px] sm:text-xs text-slate-500 italic">
                                  No hay copias de este set registradas en la comunidad actualmente.
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => setDetailCard(card)}
                              className="self-end sm:self-auto inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer shrink-0"
                            >
                              Ver detalle completo
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            </section>
          )}
        </AnimatePresence>

        {/* ── Sección de Coleccionistas de la Comunidad ────────────────── */}
        <section id="coleccionistas" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-slate-300 text-xs font-mono font-medium mb-3">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>COMUNIDAD ACTIVA</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-wide">
              DUELISTAS Y PORTAFOLIOS
            </h2>
            <p className="font-ui text-sm sm:text-base text-slate-400 max-w-md mt-2">
              Explora las colecciones públicas de otros miembros, revisa sus cartas en inventario o apóyalos con su lista de deseos.
            </p>
          </div>

          {/* Grid de Coleccionistas */}
          {loadingUsers ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="h-32 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No hay coleccionistas registrados aún en la plataforma.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((u, i) => (
                <motion.div
                  key={u.slug}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  onClick={() => navigate(`/portfolio/${u.slug}`)}
                  className="glass-textured group relative rounded-xl border border-white/10 bg-[#0f1420]/80 hover:bg-[#151c2c]/90 hover:border-amber-500/40 p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-md hover:shadow-[0_8px_30px_rgba(245,158,11,0.1)]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-heading font-bold text-white text-lg group-hover:text-amber-400 transition-colors truncate">
                        {u.displayName}
                      </h3>
                      {u.hasWhatsapp && (
                        <span
                          title="Ventas y tratos activos por WhatsApp"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-400" />
                          <span>WhatsApp</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-mono truncate mt-1">
                      /portfolio/{u.slug}
                    </p>
                  </div>

                  {/* Footer con contadores de cartas y link */}
                  <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 font-medium text-amber-300 font-stat">
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        <span>{u.inventoryCount}</span>
                        <span className="text-slate-500 text-[11px] font-ui">cartas</span>
                      </span>
                      {u.wishlistCount > 0 && (
                        <span
                          className="flex items-center gap-1 font-medium text-rose-300 font-stat"
                          title="Cartas en lista de deseos"
                        >
                          <Heart className="w-3.5 h-3.5 text-rose-400" />
                          <span>{u.wishlistCount}</span>
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-bold text-slate-400 group-hover:text-amber-400 transition-colors flex items-center gap-1">
                      Ver Portafolio
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* ── Sección de Características ("Arsenal para Duelistas") ──── */}
        <section id="caracteristicas" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-slate-300 text-xs font-mono font-medium mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>SISTEMA TCG</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-wide">
              TODO LO QUE NECESITAS PARA TU COLECCIÓN
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="glass-textured relative rounded-2xl border border-white/10 bg-[#0d121c]/80 hover:bg-[#121824] p-6 transition-all duration-200 group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{
                    background: `${f.color}15`,
                    border: `1px solid ${f.borderGlow}`,
                  }}
                >
                  <f.icon style={{ width: 20, height: 20, color: f.color }} />
                </div>
                <span
                  className="text-[10px] font-mono uppercase tracking-widest font-bold block mb-1"
                  style={{ color: f.color }}
                >
                  {f.tag}
                </span>
                <h3 className="font-heading text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="font-ui text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Banner CTA para Nuevos Coleccionistas ─────────────────── */}
        <section className="w-full max-w-4xl mx-auto px-4 py-12 mb-12">
          <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-[#111827] to-purple-500/15 p-8 sm:p-10 text-center backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_40px_rgba(245,158,11,0.1)]">
            {/* Fondo con textura de artículos milenarios */}
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay"
              style={{
                backgroundImage: "url('/2.webp')",
                backgroundSize: "320px",
                backgroundRepeat: "repeat"
              }}
            />
            {/* Resplandor áureo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-48 bg-amber-500/20 blur-[80px] pointer-events-none rounded-full" />

            <div className="relative z-10 flex flex-col items-center">
              <Sparkles className="w-8 h-8 text-amber-400 mb-3 animate-pulse" />
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2 tracking-wide">
                ¿ERES COLECCIONISTA DE YU-GI-OH!?
              </h2>
              <p className="font-ui text-sm sm:text-base text-slate-300 max-w-lg mb-6 leading-relaxed font-medium">
                Organiza tus cartas, define precios de venta, arma tu lista de deseos y comparte tu portafolio público con duelistas de todo el mundo.
              </p>
              <a
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black text-sm font-bold shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all transform active:scale-95"
              >
                <Lock className="w-4 h-4" />
                <span>Acceder al Panel de Coleccionista</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* ── Footer Oficial ─────────────────────────────────────────── */}
        <footer className="mt-auto border-t border-white/5 bg-[#06080d] py-8 text-xs text-slate-500">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Yu-Gi-Oh!" className="h-6 w-auto opacity-70" />
              <span>Yu-Gi-Oh! Inventory & Portfolio</span>
            </div>
            <p className="text-center sm:text-right">
              Powered by{' '}
              <a
                href="https://db.ygoprodeck.com"
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-amber-400 transition-colors font-medium"
              >
                YGOProdeck API
              </a>
              . Yu-Gi-Oh! es una marca registrada de Konami.
            </p>
          </div>
        </footer>

        {/* Modal de Detalle Completo de Carta */}
        {detailCard && (
          <CardDetailModal
            card={detailCard}
            onClose={() => setDetailCard(null)}
            isPublic={true}
          />
        )}

      </div>
    </>
  )
}
