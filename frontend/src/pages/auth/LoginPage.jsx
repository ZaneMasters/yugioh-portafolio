import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { Shield, Eye, EyeOff, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const ok = await login(email, password)
    if (ok) navigate('/admin/search', { replace: true })
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      
      {/* ── Lado Visual (Izquierdo) ── */}
      <div className="hidden lg:flex flex-1 relative bg-black items-center justify-center overflow-hidden">
        {/* Imagen de fondo (Yami minimalista) - bg-contain para evitar pixelado al estirarse */}
        <div 
          className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-90 scale-105"
          style={{ backgroundImage: 'url(/1.jpg)' }}
        />
        {/* Gradiente para fusionarse con el lado del formulario */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-[#080a11]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080a11] via-transparent to-transparent" />
      </div>

      {/* ── Lado Formulario (Derecho) ── */}
      <div className="w-full lg:w-[500px] xl:w-[600px] flex items-center justify-center p-8 relative glass-textured border-l border-white/5 shadow-2xl z-10">
        
        {/* Luces decorativas sutiles detrás del form */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-sm relative"
        >
          {/* Header del formulario */}
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-black text-white font-display mb-2">
              Yu-Gi-Oh! <span className="text-gradient">Inventory</span>
            </h1>
            <p className="text-slate-400 text-sm font-heading tracking-wide uppercase">Bóveda de Administración</p>
          </div>

          <div className="flex items-center gap-3 mb-8 opacity-60">
            <div className="flex-1 h-px bg-white/20" />
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-slate-400">
              <Shield className="w-3.5 h-3.5" />
              Acceso Restringido
            </div>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                placeholder="Email de administrador"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
                className="
                  w-full bg-[#111827]/80 border border-white/10 rounded-xl text-slate-100 text-sm
                  placeholder:text-slate-600 outline-none transition-all backdrop-blur-md
                  focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10 focus:bg-[#1f2937]/90
                  pl-10 pr-4 py-3
                "
              />
            </div>

            {/* Contraseña */}
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="
                  w-full bg-[#111827]/80 border border-white/10 rounded-xl text-slate-100 text-sm
                  placeholder:text-slate-600 outline-none transition-all backdrop-blur-md
                  focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10 focus:bg-[#1f2937]/90
                  pl-10 pr-10 py-3
                "
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex justify-end pt-1 pb-4">
              <a 
                href="/recover-password" 
                onClick={(e) => { e.preventDefault(); navigate('/recover-password') }}
                className="text-xs text-amber-500/80 hover:text-amber-400 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading || !password || !email}
              className="
                w-full py-3 rounded-xl font-bold text-sm transition-all duration-300
                bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400
                text-black active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
                shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_25px_rgba(245,158,11,0.3)]
              "
            >
              {loading ? 'Sincronizando...' : 'Desbloquear Bóveda'}
            </button>
          </form>

          <p className="text-center mt-8 text-xs text-slate-500">
            ¿Solo quieres ver la colección?{' '}
            <a href="/" className="text-amber-400/80 hover:text-amber-300 transition-colors">
              Ver galería pública
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

