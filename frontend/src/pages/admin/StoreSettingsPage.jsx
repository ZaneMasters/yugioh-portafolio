import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, Store, MessageCircle, Info } from 'lucide-react'
import { updateProfile } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function StoreSettingsPage() {
  const { profile, updateProfileContext } = useAuth()
  
  const [whatsapp, setWhatsapp] = useState('')
  const [whatsappLoading, setWhatsappLoading] = useState(false)

  useEffect(() => {
    if (profile?.whatsapp) {
      setWhatsapp(profile.whatsapp)
    }
  }, [profile])

  const handleWhatsappSubmit = async (e) => {
    e.preventDefault()
    setWhatsappLoading(true)
    try {
      const payload = { 
        slug: profile?.slug, 
        whatsapp: whatsapp.trim() || null 
      }
      const res = await updateProfile(payload)
      toast.success(res.message || 'Número de WhatsApp actualizado')
      updateProfileContext(res.data)
    } catch (error) {
      toast.error(error.message || 'Error al actualizar WhatsApp')
    } finally {
      setWhatsappLoading(false)
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
          <Store className="w-6 h-6 text-green-500 shrink-0" />
          <span>Configuración de la <span className="text-gradient-green text-green-400">Tienda</span></span>
        </h1>
        <p className="text-slate-400 mt-2 text-sm">
          Gestiona las opciones de contacto y configuraciones para recibir pedidos de tus visitantes.
        </p>
      </motion.div>

      {/* SECCIÓN: CONTACTO PARA PEDIDOS */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-6 md:p-8 border border-white/5 relative overflow-hidden"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <img src="/whatsapp.svg" alt="WhatsApp" className="w-6 h-6 drop-shadow-sm" />
          Contacto para Pedidos (Carrito)
        </h2>
        <form onSubmit={handleWhatsappSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300 ml-1">Número de WhatsApp</label>
            <div className="mt-1.5 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  placeholder="+573001234567"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="
                    w-full bg-[#111827] border border-[#374151] rounded-lg text-slate-100 font-medium text-sm
                    placeholder:text-slate-600 outline-none transition-all
                    focus:border-green-500/60 focus:ring-2 focus:ring-green-500/10
                    px-4 py-3
                  "
                />
              </div>
              <button
                type="submit"
                disabled={
                  whatsappLoading || 
                  whatsapp === (profile?.whatsapp || '') ||
                  (whatsapp.trim() !== '' && !/^\+?[0-9]{10,15}$/.test(whatsapp.trim()))
                }
                className="
                  flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-150
                  bg-green-500 hover:bg-green-400 text-black active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center
                  shadow-lg shadow-green-500/20 whitespace-nowrap
                "
              >
                <Save className="w-4 h-4" />
                {whatsappLoading ? 'Guardando...' : 'Guardar WhatsApp'}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2 ml-1">
              Incluye el código de país (ej. +52, +57, +34). Los visitantes usarán este número para enviarte sus pedidos mediante el carrito de compras.
            </p>
          </div>
          
          <div className="flex items-start gap-2 p-3 mt-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-200/80 leading-relaxed">
              Al configurar este número, se habilitará el carrito de compras en tu portafolio público, permitiendo a los visitantes enviarte mensajes directos por WhatsApp con los detalles de las cartas que desean.
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
