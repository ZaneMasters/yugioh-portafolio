import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, AlertTriangle, AlertCircle, CheckCircle2, X } from 'lucide-react'
import { Button } from './Button'
import { lockScroll, unlockScroll } from '../../utils/scrollLock'

/**
 * Modal de confirmación genérico / eliminación.
 * Se monta en document.body mediante portal para evitar problemas con z-index.
 *
 * @param {boolean}  open        — Si el modal está visible
 * @param {string}   cardName    — Nombre de la carta a eliminar (opcional)
 * @param {string}   cardImage   — URL de la imagen de la carta (opcional)
 * @param {boolean}  loading     — Si la acción está en progreso
 * @param {Function} onConfirm   — Callback al confirmar
 * @param {Function} onCancel    — Callback al cancelar
 * @param {string}   title       — Título del modal
 * @param {string}   description — Descripción o advertencia
 * @param {string}   type        — 'danger' | 'success' | 'warning' (default: 'danger')
 * @param {string}   confirmText — Texto del botón confirmar
 * @param {string}   cancelText  — Texto del botón cancelar
 * @param {Component} confirmIcon — Icono del botón confirmar
 */
export function ConfirmDeleteModal({
  open,
  cardName,
  cardImage,
  loading,
  onConfirm,
  onCancel,
  title,
  description,
  type = 'danger',
  confirmText,
  cancelText = 'Cancelar',
  confirmIcon,
  children,
}) {
  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape' && !loading) onCancel() }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, loading, onCancel])

  // Bloquear scroll mientras el modal está abierto (contador compartido)
  useEffect(() => {
    if (open) lockScroll()
    else unlockScroll()
    return () => unlockScroll()
  }, [open])

  // Configuración según tipo
  const isSuccess = type === 'success'
  const isWarning = type === 'warning'
  const isDanger = type === 'danger' || (!isSuccess && !isWarning)

  const HeaderIcon = isSuccess ? CheckCircle2 : (isWarning ? AlertCircle : AlertTriangle)
  const headerIconBg = isSuccess
    ? 'bg-emerald-500/15 text-emerald-400'
    : isWarning
      ? 'bg-amber-500/15 text-amber-400'
      : 'bg-red-500/15 text-red-400'

  const defaultTitle = isSuccess ? 'Confirmar acción' : (isWarning ? 'Atención' : 'Eliminar carta')
  const defaultConfirmText = isSuccess ? 'Confirmar' : (isWarning ? 'Aceptar' : 'Eliminar')
  const DefaultConfirmIcon = isSuccess ? CheckCircle2 : (isWarning ? AlertCircle : Trash2)

  const confirmBtnClass = isSuccess
    ? 'bg-emerald-500 hover:bg-emerald-400 text-black border-emerald-500 font-semibold shadow-lg shadow-emerald-500/20'
    : isWarning
      ? 'bg-amber-500 hover:bg-amber-400 text-black border-amber-500 font-semibold shadow-lg shadow-amber-500/20'
      : 'bg-red-500/80 hover:bg-red-500 text-white border-red-500/40 font-semibold shadow-lg shadow-red-500/20'

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

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <span className={`flex items-center justify-center w-8 h-8 rounded-full ${headerIconBg}`}>
                    <HeaderIcon className="w-4 h-4" />
                  </span>
                  <h2 className="text-sm font-semibold text-white">{title || defaultTitle}</h2>
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
              <div className="px-5 py-4">
                {children ? (
                  children
                ) : cardName ? (
                  <div className="flex items-center gap-4">
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
                        {title ? '?' : ' de tu inventario?'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {description || 'Esta acción no se puede deshacer.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {description || '¿Deseas continuar con esta acción?'}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-2 justify-end px-5 pb-5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  disabled={loading}
                >
                  {cancelText}
                </Button>
                <Button
                  variant={isSuccess ? 'success' : isDanger ? 'danger' : 'primary'}
                  size="sm"
                  icon={confirmIcon || DefaultConfirmIcon}
                  loading={loading}
                  onClick={onConfirm}
                  className={confirmBtnClass}
                >
                  {confirmText || defaultConfirmText}
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

export { ConfirmDeleteModal as ConfirmModal }

