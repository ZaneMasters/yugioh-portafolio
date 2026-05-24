import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Layers, Heart, FolderOpen, ArrowRight, Lock, Sparkles } from 'lucide-react'
import { Helmet } from 'react-helmet-async'

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

export default function HomePage() {
  const [slug, setSlug]     = useState('')
  const [error, setError]   = useState('')
  const navigate            = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    const clean = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (!clean) {
      setError('Ingresa un nombre de usuario válido.')
      return
    }
    navigate(`/portfolio/${clean}`)
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
            Portafolios públicos de Yu-Gi-Oh!
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
              colecciones
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="text-slate-400 text-center text-base sm:text-lg max-w-md mb-10 leading-relaxed"
          >
            Busca a un coleccionista por su nombre de usuario para ver su inventario, wishlist y colecciones.
          </motion.p>

          {/* Search box */}
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            onSubmit={handleSearch}
            className="w-full max-w-md"
          >
            <div
              className="flex items-center gap-0 rounded-xl overflow-hidden border border-white/10 bg-[#111827] focus-within:border-amber-500/50 focus-within:ring-2 focus-within:ring-amber-500/10 transition-all"
            >
              {/* Prefix */}
              <span className="shrink-0 pl-4 pr-2 text-slate-500 text-sm whitespace-nowrap select-none">
                /portfolio/
              </span>

              {/* Input */}
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                  setError('')
                }}
                placeholder="nombre-de-usuario"
                autoComplete="off"
                spellCheck={false}
                className="flex-1 bg-transparent text-amber-400 font-medium text-sm py-3.5 outline-none placeholder:text-slate-600 min-w-0"
              />

              {/* Botón */}
              <button
                type="submit"
                className="shrink-0 flex items-center gap-1.5 px-4 py-3.5 bg-amber-500 hover:bg-amber-400 active:scale-[0.97] text-black text-sm font-bold transition-all duration-150"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Ver portafolio</span>
              </button>
            </div>

            {error && (
              <p className="text-xs text-rose-400 mt-2 ml-1">{error}</p>
            )}

            <p className="text-xs text-slate-600 mt-2 ml-1">
              Ej: <span className="text-slate-500 font-mono">angel</span> → verás el portafolio de ese coleccionista
            </p>
          </motion.form>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="flex items-center gap-4 w-full max-w-xl my-14"
          >
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-slate-600 uppercase tracking-widest">Features</span>
            <div className="flex-1 h-px bg-white/5" />
          </motion.div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38 + i * 0.08 }}
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

      </div>
    </>
  )
}
