import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, Save, User, Link as LinkIcon, Info } from 'lucide-react'
import { changePassword, updateProfile } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { profile, updateProfileContext } = useAuth()
  
  // Estado para el Slug
  const [slug, setSlug] = useState('')
  const [slugLoading, setSlugLoading] = useState(false)

  // Estado para Contraseña
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)

  useEffect(() => {
    if (profile?.slug) {
      setSlug(profile.slug)
    }
  }, [profile])

  const handleSlugSubmit = async (e) => {
    e.preventDefault()
    if (!slug || slug.trim() === '') {
      toast.error('El nombre de usuario no puede estar vacío')
      return
    }

    setSlugLoading(true)
    try {
      const res = await updateProfile({ slug: slug.trim().toLowerCase() })
      toast.success(res.message || 'Nombre de usuario actualizado')
      updateProfileContext(res.data)
    } catch (error) {
      toast.error(error.message || 'Error al actualizar el nombre de usuario')
    } finally {
      setSlugLoading(false)
    }
  }

  const handlePwdSubmit = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setPwdLoading(true)
    try {
      const res = await changePassword(newPassword)
      toast.success(res.message || 'Contraseña actualizada correctamente')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      toast.error(error.message || 'Error al cambiar contraseña')
    } finally {
      setPwdLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto w-full space-y-8">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-black text-white font-display flex items-center gap-2">
          <User className="w-6 h-6 text-amber-500 shrink-0" />
          <span>Configuración del <span className="text-gradient">Perfil</span></span>
        </h1>
        <p className="text-slate-400 mt-2 text-sm">
          Personaliza tu URL pública y gestiona tu seguridad.
        </p>
      </motion.div>

      {/* SECCIÓN: URL PÚBLICA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-6 md:p-8 border border-white/5 relative overflow-hidden"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-amber-500" />
          URL de tu Portafolio
        </h2>
        <form onSubmit={handleSlugSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300 ml-1">Nombre de Usuario Único</label>
            <div className="mt-1.5 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="relative flex-1 w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
                  yugioh.com/portfolio/
                </span>
                <input
                  type="text"
                  placeholder="tu-nombre"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  required
                  className="
                    w-full bg-[#111827] border border-[#374151] rounded-lg text-amber-400 font-medium text-sm
                    placeholder:text-slate-600 outline-none transition-all
                    focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10
                    pl-[145px] pr-4 py-3
                  "
                />
              </div>
              <button
                type="submit"
                disabled={slugLoading || slug === profile?.slug || !slug}
                className="
                  flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-150
                  bg-amber-500 hover:bg-amber-400 text-black active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center
                  shadow-lg shadow-amber-500/20 whitespace-nowrap
                "
              >
                <Save className="w-4 h-4" />
                {slugLoading ? 'Guardando...' : 'Guardar URL'}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2 ml-1">
              Solo se permiten letras minúsculas, números y guiones. Al cambiarlo, tu URL anterior dejará de funcionar.
            </p>
            <div className="flex items-start gap-2 p-3 mt-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-200/80 leading-relaxed">
                Debido a sistemas de caché para optimizar la velocidad, <strong>el cambio podría tardar hasta 10 minutos</strong> en reflejarse globalmente. Durante este periodo, la URL anterior podría seguir funcionando temporalmente.
              </p>
            </div>
          </div>
        </form>
      </motion.div>

      {/* SECCIÓN: SEGURIDAD (CONTRASEÑA) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-6 md:p-8 border border-white/5"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-500" />
          Seguridad
        </h2>
        <form onSubmit={handlePwdSubmit} className="space-y-5">
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

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={pwdLoading || !newPassword || !confirmPassword}
              className="
                flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-150
                bg-amber-500 hover:bg-amber-400 text-black active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed
                shadow-lg shadow-amber-500/20
              "
            >
              <Save className="w-4 h-4" />
              {pwdLoading ? 'Guardando...' : 'Actualizar Contraseña'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
