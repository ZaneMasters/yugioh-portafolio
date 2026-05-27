import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, Save } from 'lucide-react'
import { changePassword } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const { logout } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    try {
      const res = await changePassword(newPassword)
      toast.success(res.message || 'Contraseña actualizada. Por favor, inicia sesión nuevamente.')
      setNewPassword('')
      setConfirmPassword('')
      // Cerrar sesión para obligar a logearse con la nueva contraseña
      await logout()
    } catch (error) {
      toast.error(error.message || 'Error al cambiar contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-black text-white font-display flex items-center gap-2">
          <Lock className="w-6 h-6 text-amber-500" />
          Cambiar <span className="text-gradient">Contraseña</span>
        </h1>
        <p className="text-slate-400 mt-2 text-sm">
          Asegúrate de usar una contraseña segura con al menos 6 caracteres.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-6 md:p-8 border border-white/5"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300 ml-1">Nueva Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Ingresa tu nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="
                  w-full bg-[#111827] border border-[#374151] rounded-lg text-slate-100 text-sm
                  placeholder:text-slate-600 outline-none transition-all
                  focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10
                  pl-9 pr-10 py-3
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
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300 ml-1">Confirmar Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showConfirmPwd ? 'text' : 'password'}
                placeholder="Repite tu nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="
                  w-full bg-[#111827] border border-[#374151] rounded-lg text-slate-100 text-sm
                  placeholder:text-slate-600 outline-none transition-all
                  focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10
                  pl-9 pr-10 py-3
                "
              />
              <button
                type="button"
                onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="
                flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-150
                bg-amber-500 hover:bg-amber-400 text-black active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed
                shadow-lg shadow-amber-500/20
              "
            >
              <Save className="w-4 h-4" />
              {loading ? 'Guardando...' : 'Actualizar Contraseña'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
