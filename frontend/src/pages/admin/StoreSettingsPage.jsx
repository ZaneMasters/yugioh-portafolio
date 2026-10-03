import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, Store, Clock, Info } from 'lucide-react'
import { updateProfile } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function StoreSettingsPage() {
  const { profile, updateProfileContext } = useAuth()
  
  const [whatsapp, setWhatsapp] = useState('')
  const [reservationHours, setReservationHours] = useState(48)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (profile?.whatsapp) {
      setWhatsapp(profile.whatsapp)
    }
    if (profile?.reservationHoursLimit) {
      setReservationHours(Number(profile.reservationHoursLimit))
    }
  }, [profile])

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { 
        slug: profile?.slug, 
        whatsapp: whatsapp.trim() || null,
        reservationHoursLimit: Number(reservationHours) || 48
      }
      const res = await updateProfile(payload)
      toast.success(res.message || 'Configuración de la tienda guardada')
      updateProfileContext(res.data)
    } catch (error) {
      toast.error(error.message || 'Error al guardar la configuración')
    } finally {
      setLoading(false)
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
          Gestiona las opciones de contacto y reservas automáticas para los pedidos de tus visitantes.
        </p>
      </motion.div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* SECCIÓN 1: CONTACTO PARA PEDIDOS */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 md:p-8 border border-white/5 relative overflow-hidden"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <img src="/whatsapp.svg" alt="WhatsApp" className="w-6 h-6 drop-shadow-sm" />
            Contacto para Pedidos (WhatsApp)
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 ml-1">Número de WhatsApp</label>
              <div className="mt-1.5">
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
              <p className="text-xs text-slate-500 mt-2 ml-1">
                Incluye el código de país (ej. +52, +57, +34). Los visitantes usarán este número para enviarte sus pedidos.
              </p>
            </div>
            
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-200/80 leading-relaxed">
                Al configurar este número, se habilitará el carrito de compras en tu portafolio público, permitiendo a los visitantes apartar cartas y enviarte el pedido listo a tu WhatsApp.
              </p>
            </div>
          </div>
        </motion.div>

        {/* SECCIÓN 2: TIEMPO LÍMITE DE RESERVA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-2xl p-6 md:p-8 border border-white/5 relative overflow-hidden"
        >
          <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Tiempo Límite de Reserva
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Cuando un cliente envía un pedido, sus cartas quedan marcadas como <span className="text-amber-300 font-semibold">Reservadas</span>. Si no confirmas la venta en este lapso, el sistema las liberará automáticamente al inventario disponible.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[24, 48, 72, 120].map((hours) => (
              <button
                key={hours}
                type="button"
                onClick={() => setReservationHours(hours)}
                className={`py-3 px-4 rounded-xl border text-center transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out active:scale-[0.96] ${
                  reservationHours === hours
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold shadow-lg shadow-amber-500/10'
                    : 'bg-[#111827] border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                }`}
              >
                <div className="text-base font-bold">{hours}h</div>
                <div className="text-[11px] opacity-75">{hours / 24} {hours === 24 ? 'día' : 'días'}</div>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-300 whitespace-nowrap">O definir horas exactas:</label>
            <input
              type="number"
              min="1"
              max="168"
              value={reservationHours}
              onChange={(e) => setReservationHours(Math.max(1, Math.min(168, Number(e.target.value) || 1)))}
              className="w-24 bg-[#111827] border border-[#374151] rounded-lg text-slate-100 font-medium text-sm text-center px-3 py-2 outline-none focus:border-amber-500/50"
            />
            <span className="text-xs text-slate-400">horas (máx 168h / 7 días)</span>
          </div>
        </motion.div>

        {/* BOTÓN GUARDAR TODO */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={
              loading || 
              (whatsapp.trim() !== '' && !/^\+?[0-9]{10,15}$/.test(whatsapp.trim()))
            }
            className="
              flex items-center gap-2 ps-7 pe-8 py-3.5 rounded-xl font-bold text-sm
              transition-[background-color,box-shadow,transform] duration-150 ease-out
              bg-emerald-500 hover:bg-emerald-400 text-black active:scale-[0.96]
              disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-emerald-500/20
            "
          >
            <Save className="w-4 h-4" />
            {loading ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </form>
    </div>
  )
}
