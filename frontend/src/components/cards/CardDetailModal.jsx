import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sword, Shield, Star, Layers, Zap, Scroll, GitMerge, Link2 } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { FRAME_TYPE_COLORS, CONDITION_COLORS, CONDITIONS } from '../../utils/constants'

// Iconos y colores por tipo de carta
const TYPE_META = {
  'Normal Monster':            { label: 'Monstruo Normal',       color: 'text-yellow-400',  bg: 'bg-yellow-500/10' },
  'Effect Monster':            { label: 'Monstruo de Efecto',    color: 'text-orange-400',  bg: 'bg-orange-500/10' },
  'Ritual Monster':            { label: 'Monstruo Ritual',       color: 'text-blue-400',    bg: 'bg-blue-500/10'   },
  'Fusion Monster':            { label: 'Monstruo de Fusión',    color: 'text-purple-400',  bg: 'bg-purple-500/10' },
  'Synchro Monster':           { label: 'Monstruo Sincronía',    color: 'text-slate-300',   bg: 'bg-slate-500/10'  },
  'XYZ Monster':               { label: 'Monstruo XYZ',          color: 'text-gray-300',    bg: 'bg-gray-500/10'   },
  'Link Monster':              { label: 'Monstruo Enlace',       color: 'text-sky-400',     bg: 'bg-sky-500/10'    },
  'Pendulum Effect Monster':   { label: 'Monstruo Péndulo',      color: 'text-teal-400',    bg: 'bg-teal-500/10'   },
  'Spell Card':                { label: 'Carta Mágica',          color: 'text-emerald-400', bg: 'bg-emerald-500/10'},
  'Trap Card':                 { label: 'Carta de Trampa',       color: 'text-rose-400',    bg: 'bg-rose-500/10'   },
}

const conditionLabel = (value) =>
  CONDITIONS.find((c) => c.value === value)?.label ?? value

/**
 * Modal de detalles de carta con toda la información del inventario.
 * Se monta en document.body mediante portal.
 */
export function CardDetailModal({ card, onClose }) {
  const open = !!card

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const frameGradient = card ? (FRAME_TYPE_COLORS[card.frameType] ?? FRAME_TYPE_COLORS.normal) : ''
  const typeMeta = card ? (TYPE_META[card.type] ?? { label: card.type, color: 'text-slate-400', bg: 'bg-slate-500/10' }) : {}

  return createPortal(
    <AnimatePresence>
      {open && card && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 24 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className={`
                pointer-events-auto w-full max-w-2xl max-h-[90vh] overflow-y-auto
                rounded-2xl border border-white/10 shadow-2xl shadow-black/60
                bg-gradient-to-br ${frameGradient} bg-[#111827]
                scrollbar-thin scrollbar-thumb-white/10
              `}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header: imagen + nombre */}
              <div className="relative flex gap-0 overflow-hidden rounded-t-2xl">
                {/* Imagen grande */}
                <div className="shrink-0 w-36 sm:w-44 bg-black/40">
                  <img
                    src={card.image}
                    alt={card.name}
                    loading="lazy"
                    className="w-full h-full object-contain"
                    onError={(e) => { e.target.src = '/card-placeholder.png' }}
                  />
                </div>

                {/* Info rápida */}
                <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                  <div>
                    {/* Tipo badge */}
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-2 ${typeMeta.color} ${typeMeta.bg}`}>
                      {typeMeta.label}
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold text-white leading-tight mb-1">
                      {card.name}
                    </h2>
                    {card.archetype && (
                      <p className="text-xs text-purple-400/80 mb-3">
                        <span className="text-slate-500">Arquetipo:</span> {card.archetype}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="space-y-2">
                    {/* ATK / DEF / Nivel */}
                    {(card.atk !== null || card.def !== null || card.level) && (
                      <div className="flex flex-wrap gap-3 text-sm">
                        {card.atk !== null && (
                          <span className="flex items-center gap-1.5 text-red-400 font-bold">
                            <Sword className="w-4 h-4" /> ATK {card.atk}
                          </span>
                        )}
                        {card.def !== null && (
                          <span className="flex items-center gap-1.5 text-sky-400 font-bold">
                            <Shield className="w-4 h-4" /> DEF {card.def}
                          </span>
                        )}
                        {card.level && (
                          <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                            <Star className="w-4 h-4" /> Nivel {card.level}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Inventario: cantidad + condición */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 border border-white/10 text-xs text-white font-bold">
                        <Layers className="w-3 h-3" /> ×{card.quantity}
                      </span>
                      <Badge condition={card.condition} />
                    </div>
                  </div>
                </div>

                {/* Botón cerrar */}
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 flex items-center justify-center w-7 h-7 rounded-full bg-black/40 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Descripción / Body */}
              <div className="p-5 space-y-4 border-t border-white/5">

                {/* Descripción */}
                {card.desc && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Descripción</p>
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                      {card.desc}
                    </p>
                  </div>
                )}

                {/* Detalles extra en grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  {card.race && (
                    <DetailChip label="Tipo / Raza" value={card.race} />
                  )}
                  {card.attribute && (
                    <DetailChip label="Atributo" value={card.attribute} />
                  )}
                  {card.frameType && (
                    <DetailChip label="Tipo" value={card.frameType.charAt(0).toUpperCase() + card.frameType.slice(1)} />
                  )}
                  <DetailChip label="Condición" value={conditionLabel(card.condition)} />
                  <DetailChip label="Cantidad" value={`×${card.quantity}`} />
                  {card.archetype && (
                    <DetailChip label="Arquetipo" value={card.archetype} />
                  )}
                </div>

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function DetailChip({ label, value }) {
  return (
    <div className="bg-white/[0.04] border border-white/5 rounded-lg px-3 py-2">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-xs text-slate-200 font-medium truncate">{value}</p>
    </div>
  )
}
