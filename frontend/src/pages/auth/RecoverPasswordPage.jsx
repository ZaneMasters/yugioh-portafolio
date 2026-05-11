import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft } from 'lucide-react'
import { recoverPassword } from '../../services/authService'
import toast from 'react-hot-toast'

export default function RecoverPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await recoverPassword(email)
      toast.success(res.message || 'Se han enviado las instrucciones de recuperación.')
      setSuccess(true)
    } catch (err) {
      toast.error(err.message || 'Error al solicitar recuperación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
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
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-amber-400 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Login
          </button>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-white font-display">
              Recuperar <span className="text-gradient">Contraseña</span>
            </h1>
            <p className="text-slate-400 text-sm mt-2 font-heading">
              {success
                ? 'Revisa tu bandeja de entrada.'
                : 'Ingresa tu correo y te enviaremos instrucciones.'}
            </p>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  placeholder="Tu correo electrónico"
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

              <button
                type="submit"
                disabled={loading || !email}
                className="
                  w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-150
                  bg-amber-500 hover:bg-amber-400 text-black active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  shadow-lg shadow-amber-500/20 mt-2
                "
              >
                {loading ? 'Enviando...' : 'Enviar correo de recuperación'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 text-center">
                Si no encuentras el correo, por favor revisa tu carpeta de <span className="text-amber-400/80">spam o correo no deseado</span>.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="
                  w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-150
                  bg-[#1f2937] hover:bg-[#374151] text-white border border-white/10
                "
              >
                Ir a iniciar sesión
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
