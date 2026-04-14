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
    <div className="min-h-screen bg-[#0d0f1a] flex items-center justify-center p-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative w-full max-w-sm"
      >
        <div className="glass rounded-2xl p-8 border border-white/10 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-purple-600 shadow-lg shadow-amber-500/25 mb-4">
              <span className="text-white font-black text-2xl">Yu</span>
            </div>
            <h1 className="text-2xl font-black text-white">
              Gi-Oh! <span className="text-gradient">Inventory</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">Panel de Administración</p>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Shield className="w-3.5 h-3.5" />
              Acceso privado
            </div>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                placeholder="Email de administrador"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
                className="
                  w-full bg-[#1f2937] border border-[#374151] rounded-lg text-slate-100 text-sm
                  placeholder:text-slate-600 outline-none transition-all
                  focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10
                  pl-9 pr-4 py-2.5
                "
              />
            </div>

            {/* Contraseña */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="
                  w-full bg-[#1f2937] border border-[#374151] rounded-lg text-slate-100 text-sm
                  placeholder:text-slate-600 outline-none transition-all
                  focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10
                  pl-9 pr-10 py-2.5
                "
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !password || !email}
              className="
                w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-150
                bg-amber-500 hover:bg-amber-400 text-black active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed
                shadow-lg shadow-amber-500/20
              "
            >
              {loading ? 'Verificando...' : 'Entrar al panel'}
            </button>
          </form>
        </div>

        <p className="text-center mt-4 text-sm text-slate-500">
          ¿Solo quieres ver la colección?{' '}
          <a href="/" className="text-amber-400 hover:text-amber-300 transition-colors">
            Ver galería pública
          </a>
        </p>
      </motion.div>
    </div>
  )
}

