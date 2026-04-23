import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, AlertTriangle, X } from 'lucide-react'
import { Button } from './Button'

/**
 * Modal de confirmación de eliminación.
 * Se monta en document.body mediante portal para evitar problemas con z-index.
 *
 * @param {boolean}  open      — Si el modal está visible
 * @param {string}   cardName  — Nombre de la carta a eliminar
 * @param {string}   cardImage — URL de la imagen de la carta
 * @param {boolean}  loading   — Si la eliminación está en progreso
 * @param {Function} onConfirm — Callback al confirmar
 * @param {Function} onCancel  — Callback al cancelar
 */
export function ConfirmDeleteModal({ open, cardName, cardImage, loading, onConfirm, onCancel }) {
  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape' && !loading) onCancel() }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, loading, onCancel])

  // Bloquear scroll mientras el modal está abierto
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => !loading && onCancel()}
          />

          {/* Panel */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="fixed z-50 inset-0 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-sm bg-[#131c2e] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">

              {/* Header rojo */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/15">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </span>
                  <h2 className="text-sm font-semibold text-white">Eliminar carta</h2>
                </div>
                <button
                  onClick={() => !loading && onCancel()}
                  disabled={loading}
                  className="text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-4 flex items-center gap-4">
                {cardImage && (
                  <img
                    src={cardImage}
                    alt={cardName}
                    loading="lazy"
                    className="w-12 h-[68px] object-contain rounded-lg bg-black/30 shrink-0"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                )}
                <div className="min-w-0">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    ¿Seguro que quieres eliminar{' '}
                    <span className="text-white font-semibold break-words">&ldquo;{cardName}&rdquo;</span>
                    {' '}de tu inventario?
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Esta acción no se puede deshacer.</p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-2 justify-end px-5 pb-5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  loading={loading}
                  onClick={onConfirm}
                  className="bg-red-500/80 hover:bg-red-500 text-white border-red-500/40 font-semibold"
                >
                  Eliminar
                </Button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
