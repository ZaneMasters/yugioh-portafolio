import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Layers, Heart, FolderOpen, ArrowRight, Lock, Sparkles, Users, Tag, X, CheckCircle2 } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { usePublicUsers } from '../../hooks/usePublicUsers'
import { useSearchBySet } from '../../hooks/useSearchBySet'
import { CardDetailModal } from '../../components/cards/CardDetailModal'

const FEATURES = [
  {
    icon: Layers,
    title: 'Inventario',
    desc: 'Registra cada carta de tu colección con cantidad, condición y rareza. Organízalas en carpetas.',
    color: '#fbbf24',
  },
  {
    icon: Heart,
    title: 'Wishlist',
    desc: 'Lleva un registro de las cartas que buscas. Tu lista de deseos es pública para que otros puedan ayudarte.',
    color: '#fb7185',
  },
  {
    icon: FolderOpen,
    title: 'Colecciones',
    desc: 'Agrupa tus cartas en mazos o temáticas y compártelas con la comunidad.',
    color: '#34d399',
  },
]

const POPULAR_SET_CODES = [
  'AMDE-EN046',
  'MP24-EN001',
  'MAMA-EN066',
  'MAGO-EN035',
  'PHHY-EN091',
  'LOB-001',
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
        <title>Yu-Gi-Oh! Inventory — Gestiona y comparte tu colección</title>
        <meta name="description" content="Plataforma para gestionar y mostrar tu colección personal de cartas Yu-Gi-Oh!. Inventario, wishlist y portafolio público." />
      </Helmet>

      <div className="min-h-screen bg-[#0b0e15] flex flex-col">

        {/* ── Navbar mínimo ─────────────────────────────────────────── */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🃏</span>
            <span className="font-black text-white tracking-tight text-lg">
              YGO <span className="text-amber-400">Inventory</span>
            </span>
          </div>
          <a
            href="/login"
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-amber-400 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            Panel de Admin
          </a>
        </header>

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-6 tracking-wide uppercase"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Buscador por Código de Set
          </motion.div>

          {/* Título */}
          <motion.h1
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black text-center text-white leading-tight tracking-tight mb-4"
            style={{ fontFamily: "'Cinzel Decorative', serif" }}
          >
            Descubre{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              cartas y colecciones
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="text-slate-400 text-center text-base sm:text-lg max-w-md mb-8 leading-relaxed"
          >
            Busca cualquier carta exclusivamente por su código de expansión (Set Code) o explora los coleccionistas de la comunidad.
          </motion.p>

          {/* Search box por Set Code */}
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            onSubmit={handleSearch}
            className="w-full max-w-md"
          >
            <div
              className="flex items-center gap-0 rounded-xl overflow-hidden border border-white/10 bg-[#111827] focus-within:border-amber-500/50 focus-within:ring-2 focus-within:ring-amber-500/10 transition-all shadow-lg"
            >
              {/* Prefix */}
              <div className="shrink-0 pl-3.5 pr-2 flex items-center gap-1.5 text-amber-400 text-xs font-mono font-bold select-none">
                <Tag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">SET:</span>
              </div>

              {/* Input */}
              <input
                type="text"
                value={setCodeInput}
                onChange={(e) => {
                  setSetCodeInput(e.target.value.toUpperCase())
                  setError('')
                }}
                placeholder="Ej: LOB-001, MP24-EN001..."
                autoComplete="off"
                spellCheck={false}
                className="flex-1 bg-transparent text-amber-400 font-mono font-medium text-sm py-3.5 outline-none placeholder:text-slate-600 placeholder:font-sans min-w-0"
              />

              {/* Botón limpiar si hay texto */}
              {setCodeInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="p-2 text-slate-500 hover:text-white transition-colors"
                  title="Limpiar"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Botón buscar */}
              <button
                type="submit"
                className="shrink-0 flex items-center gap-1.5 px-4 py-3.5 bg-amber-500 hover:bg-amber-400 active:scale-[0.97] text-black text-sm font-bold transition-all duration-150 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Buscar</span>
              </button>
            </div>

            {error && (
              <p className="text-xs text-rose-400 mt-2 ml-1">{error}</p>
            )}

            {/* Quick chips con Set Codes de ejemplo */}
            <div className="mt-3 flex items-center gap-1.5 flex-wrap justify-center sm:justify-start">
              <span className="text-[11px] text-slate-500">Ejemplos:</span>
              {POPULAR_SET_CODES.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleSelectExample(code)}
                  className={`inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[11px] transition-all cursor-pointer ${
                    activeSetQuery.toUpperCase() === code.toUpperCase()
                      ? 'bg-amber-500 text-black font-bold shadow-sm'
                      : 'bg-white/[0.04] hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/30 text-slate-300 hover:text-amber-400'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </motion.form>

          {/* ── Sección de Resultados de Búsqueda por Set Code ─────────── */}
          <AnimatePresence>
            {activeSetQuery && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="w-full max-w-4xl mt-8 mb-4 p-5 rounded-2xl bg-white/[0.02] border border-amber-500/20 backdrop-blur-md shadow-[0_8px_32px_rgba(245,158,11,0.06)]"
              >
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-400" />
                    <h2 className="text-base font-bold text-white">
                      Resultados para <span className="font-mono text-amber-400">"{activeSetQuery}"</span>
                    </h2>
                    {!loadingSearch && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400 font-mono">
                        {searchResults.length} {searchResults.length === 1 ? 'carta' : 'cartas'}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleClearSearch}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cerrar
                  </button>
                </div>

                {loadingSearch ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-3" />
                    <p className="text-sm font-medium">Buscando cartas con el código {activeSetQuery}...</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-300 font-medium mb-1">
                      No se encontraron cartas con el Set Code "{activeSetQuery}"
                    </p>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Verifica que el código esté bien escrito (ej: <span className="font-mono text-amber-400">AMDE-EN046</span>, <span className="font-mono text-amber-400">MP24-EN001</span> o <span className="font-mono text-amber-400">LOB-001</span>).
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {searchResults.map((card) => {
                      const matched = card.matchedSet
                      return (
                        <div
                          key={card.cardId || card.id}
                          className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors"
                        >
                          {/* Imagen */}
                          <div 
                            onClick={() => setDetailCard(card)}
                            className="w-20 sm:w-24 shrink-0 mx-auto sm:mx-0 cursor-pointer group"
                          >
                            <img
                              src={card.imageSmall || card.image}
                              alt={card.name}
                              className="w-full h-auto rounded-lg shadow-md group-hover:scale-105 transition-transform"
                              onError={(e) => { e.target.onerror = null; e.target.src = '/card-placeholder.png' }}
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <h3 
                                  onClick={() => setDetailCard(card)}
                                  className="text-base font-bold text-white hover:text-amber-400 transition-colors cursor-pointer truncate"
                                >
                                  {card.name}
                                </h3>
                                {card.frameType && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-slate-300 shrink-0">
                                    {card.type || card.frameType}
                                  </span>
                                )}
                              </div>

                              {/* Set Code Badge */}
                              {matched && (
                                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-xs font-bold">
                                    <Tag className="w-3 h-3" />
                                    {matched.setCode}
                                  </span>
                                  {matched.rarity && (
                                    <span className="text-xs text-slate-400 font-medium">
                                      • {matched.rarity}
                                    </span>
                                  )}
                                  {matched.setName && (
                                    <span className="text-xs text-slate-500 truncate max-w-xs">
                                      ({matched.setName})
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Descripción breve */}
                              <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                                {card.desc}
                              </p>
                            </div>

                            {/* Disponibilidad en comunidad y botón de detalle */}
                            <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="min-w-0">
                                {card.communityOwners && card.communityOwners.length > 0 ? (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                      Disponible en:
                                    </span>
                                    {card.communityOwners.map((owner) => (
                                      <button
                                        key={owner.id || owner.slug}
                                        type="button"
                                        onClick={() => navigate(`/portfolio/${owner.slug}`)}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-[11px] font-medium text-emerald-300 transition-colors cursor-pointer"
                                        title={`Ver portafolio de ${owner.displayName}`}
                                      >
                                        <span>{owner.displayName}</span>
                                        <span className="font-mono text-emerald-400/80">
                                          ({owner.quantity}x{owner.price ? ` • $${owner.price}` : ''})
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-500 italic">
                                    Sin copias registradas en la comunidad actualmente
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => setDetailCard(card)}
                                className="self-end sm:self-auto text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                              >
                                Ver detalle completo
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>


          {/* ── Sección de Coleccionistas de la Comunidad ────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-4 w-full max-w-4xl my-12"
          >
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-semibold">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              Coleccionistas de la Comunidad {users.length > 0 && `(${users.length})`}
            </span>
            <div className="flex-1 h-px bg-white/5" />
          </motion.div>

          {/* Grid de Coleccionistas */}
          <div className="w-full max-w-4xl">
            {loadingUsers ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="h-28 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">
                No hay coleccionistas registrados aún.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {users.map((u, i) => (
                  <motion.div
                    key={u.slug}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.04 }}
                    onClick={() => navigate(`/portfolio/${u.slug}`)}
                    className="group relative rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-amber-500/30 p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-[0_4px_24px_rgba(245,158,11,0.08)]"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-white text-base group-hover:text-amber-400 transition-colors truncate">
                          {u.displayName}
                        </h3>
                        {u.hasWhatsapp && (
                          <span title="Ventas activas por WhatsApp" className="text-xs">💬</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-mono truncate mt-0.5">
                        /portfolio/{u.slug}
                      </p>
                    </div>

                      {/* Footer card */}
                      <div className="mt-3.5 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-[11px] text-amber-400/90 font-medium">
                            <Layers className="w-3 h-3 text-amber-400" />
                            {u.inventoryCount} {u.inventoryCount === 1 ? 'carta' : 'cartas'}
                          </span>
                          {u.wishlistCount > 0 && (
                            <span className="flex items-center gap-1 text-[11px] text-rose-400/90 font-medium" title="En lista de deseos">
                              <Heart className="w-3 h-3 text-rose-400" />
                              {u.wishlistCount}
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-slate-500 group-hover:text-amber-400 transition-colors flex items-center gap-0.5 font-medium">
                          Ver <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* ── Divider Features ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-4 w-full max-w-4xl my-14"
          >
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-slate-600 uppercase tracking-widest font-semibold">Características</span>
            <div className="flex-1 h-px bg-white/5" />
          </motion.div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.08 }}
                className="rounded-xl border border-white/5 bg-white/[0.03] p-5 hover:border-white/10 hover:bg-white/[0.05] transition-all group"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: `${f.color}15`, border: `1px solid ${f.color}30` }}
                >
                  <f.icon style={{ width: 16, height: 16, color: f.color }} />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA para admins */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.62 }}
            className="mt-12 text-center"
          >
            <p className="text-xs text-slate-600 mb-2">¿Eres coleccionista y quieres tu propio portafolio?</p>
            <a
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              Acceder al panel de administración
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </motion.div>
        </main>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <footer className="text-center py-4 border-t border-white/5 text-xs text-slate-700">
          Yu-Gi-Oh! Inventory — Powered by{' '}
          <a href="https://db.ygoprodeck.com" target="_blank" rel="noreferrer" className="hover:text-slate-500 transition-colors">
            YGOProdeck API
          </a>
        </footer>

        {/* Modal de detalle de carta */}
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

