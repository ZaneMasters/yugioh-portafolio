import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Sword, Shield, Star, Layers, Link2, Sparkles, Tag, DollarSign, Globe, BookOpen, ShoppingCart, Check, ArrowRightLeft
} from 'lucide-react'
import { Badge } from '../ui/Badge'
import { CONDITIONS, RARITIES, LANGUAGES } from '../../utils/constants'
import { lockScroll, unlockScroll } from '../../utils/scrollLock'
import { useCartStore } from '../../store/useCartStore'
import { toast } from 'react-hot-toast'


// ─── Tipo meta ────────────────────────────────────────────────────────────────
const TYPE_META_LIST = [
  { key: 'pendulum',        label: 'Péndulo',   icon: '♦', accent: '#2dd4bf' },
  { key: 'ritual',          label: 'Ritual',    icon: '🌙', accent: '#60a5fa' },
  { key: 'fusion',          label: 'Fusión',    icon: '✦', accent: '#c084fc' },
  { key: 'synchro',         label: 'Sincronía', icon: '⚡', accent: '#cbd5e1' },
  { key: 'xyz',             label: 'XYZ',       icon: '✧', accent: '#94a3b8' },
  { key: 'link',            label: 'Enlace',    icon: '⬡', accent: '#38bdf8' },
  { key: 'normal monster',  label: 'Normal',    icon: '◈', accent: '#fbbf24' },
  { key: 'effect monster',  label: 'Efecto',    icon: '◉', accent: '#fb923c' },
  { key: 'spell card',      label: 'Mágica',    icon: '♠', accent: '#34d399' },
  { key: 'trap card',       label: 'Trampa',    icon: '◆', accent: '#fb7185' },
]

function resolveTypeMeta(type) {
  if (!type) return { label: '—', icon: '?', accent: '#64748b' }
  const lower = type.toLowerCase()
  return (
    TYPE_META_LIST.find((m) => lower.includes(m.key)) ??
    { label: type, icon: '?', accent: '#64748b' }
  )
}

// ─── Atributo a color ─────────────────────────────────────────────────────────
const ATTR_COLORS = {
  DARK:   { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.4)',  text: '#a78bfa' },
  LIGHT:  { bg: 'rgba(253,224,71,0.12)', border: 'rgba(253,224,71,0.4)', text: '#fde047' },
  EARTH:  { bg: 'rgba(120,90,50,0.18)',  border: 'rgba(180,140,80,0.4)', text: '#d4a76a' },
  WATER:  { bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.4)', text: '#38bdf8' },
  FIRE:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.4)',  text: '#f87171' },
  WIND:   { bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.4)', text: '#34d399' },
  DIVINE: { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.4)', text: '#fbbf24' },
}

const conditionLabel = (v) => CONDITIONS.find((c) => c.value === v)?.label ?? v
const rarityLabel    = (v) => RARITIES.find((r)  => r.value === v)?.label ?? v

// ─── Colores de glow por frameType ───────────────────────────────────────────
const FRAME_GLOW = {
  normal:  '#ca8a04',
  effect:  '#ea580c',
  ritual:  '#3b82f6',
  fusion:  '#a855f7',
  synchro: '#94a3b8',
  xyz:     '#6b7280',
  link:    '#0ea5e9',
  spell:   '#10b981',
  trap:    '#f43f5e',
}

const FRAME_LABEL = {
  normal:  'Normal Monster',
  effect:  'Effect Monster',
  ritual:  'Ritual Monster',
  fusion:  'Fusion Monster',
  synchro: 'Synchro Monster',
  xyz:     'XYZ Monster',
  link:    'Link Monster',
  spell:   'Spell Card',
  trap:    'Trap Card',
}

// ─── CSS responsivo inyectado una vez ────────────────────────────────────────
const MODAL_STYLES = `
  .cdm-panel {
    pointer-events: auto;
    width: 100%;
    max-width: 780px;
    max-height: 92vh;
    overflow-y: auto;
    border-radius: 20px;
    background: linear-gradient(145deg, #0f1117 0%, #13161f 60%, #0b0e15 100%);
    scrollbar-width: thin;
    scrollbar-color: #ffffff18 transparent;
  }

  /* Header: columnas en desktop, apilado en mobile */
  .cdm-header {
    display: flex;
    flex-direction: row;
    position: relative;
  }

  .cdm-img-col {
    flex-shrink: 0;
    width: 180px;
    min-height: 240px;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px 16px;
  }

  .cdm-img-wrap img {
    display: block;
    width: 148px;
    height: auto;
    object-fit: contain;
  }

  .cdm-info-col {
    flex: 1;
    padding: 20px 20px 18px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }

  .cdm-card-name {
    margin: 0;
    font-size: clamp(1rem, 4vw, 1.45rem);
    font-weight: 800;
    color: #ffffff;
    line-height: 1.2;
    letter-spacing: -0.01em;
  }

  .cdm-body {
    padding: 0 20px 24px;
  }

  .cdm-close-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: rgba(0,0,0,0.5);
    border: 1px solid rgba(255,255,255,0.12);
    color: #94a3b8;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s, color 0.2s;
    z-index: 1;
  }
  .cdm-close-btn:hover {
    background: rgba(255,255,255,0.12);
    color: #fff;
  }

  .cdm-pills-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }

  .cdm-stats-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .cdm-inventory-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: auto;
  }

  /* ── Mobile (< 520px) ───────────────────────────────────── */
  @media (max-width: 520px) {
    .cdm-header {
      flex-direction: column;
      align-items: center;
      padding-top: 16px;
      padding-bottom: 0;
    }

    .cdm-img-col {
      width: 100%;
      min-height: unset;
      border-right: none !important;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      padding: 0 16px 16px;
    }

    .cdm-img-wrap img {
      width: 180px;
    }

    .cdm-info-col {
      width: 100%;
      padding: 16px;
      gap: 12px;
    }

    .cdm-card-name {
      font-size: 1.25rem;
      padding-right: 36px; /* espacio para el botón cerrar */
    }

    .cdm-body {
      padding: 0 16px 20px;
    }

    .cdm-close-btn {
      top: 12px;
      right: 12px;
    }

    .cdm-inventory-row button {
      margin-left: 0 !important;
      width: 100% !important;
      justify-content: center;
      padding-top: 12px;
      padding-bottom: 12px;
      margin-top: 4px;
      font-size: 14px;
    }
  }
`

function injectStyles() {
  if (document.getElementById('cdm-styles')) return
  const tag = document.createElement('style')
  tag.id = 'cdm-styles'
  tag.textContent = MODAL_STYLES
  document.head.appendChild(tag)
}

/**
 * Modal de detalles de carta – diseño premium, totalmente responsivo
 */
export function CardDetailModal({ card, onClose, isPublic, isWishlist = false }) {
  const open = !!card

  const { items, addItem, removeItem } = useCartStore()
  const inCartItem = card ? items.find(i => i.card.id === card.id && i.isWishlist === isWishlist) : null
  const isMaxInCart = isWishlist ? !!inCartItem : (inCartItem && inCartItem.cartQuantity >= card?.quantity)

  const handleAddToCart = (e) => {
    e.stopPropagation()
    if (isMaxInCart && card) {
      removeItem(card.id, isWishlist)
      toast.success(isWishlist ? 'Removido de trades' : 'Removido del carrito', {
        icon: '🗑️',
        style: { background: '#333', color: '#fff' }
      })
    } else if (card) {
      addItem(card, isWishlist)
      toast.success(isWishlist ? 'Añadido a trades' : 'Añadido al carrito', {
        icon: isWishlist ? '🤝' : '🛒',
        style: { background: '#333', color: '#fff' }
      })
    }
  }

  // Inyectar estilos responsivos una sola vez
  useEffect(() => { injectStyles() }, [])

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) lockScroll()
    else unlockScroll()
    return () => unlockScroll()
  }, [open])

  const frameType  = card?.frameType ?? 'normal'
  const glowColor  = FRAME_GLOW[frameType] ?? '#64748b'
  const typeMeta   = card ? resolveTypeMeta(card.type) : {}
  const attrStyle  = card?.attribute ? (ATTR_COLORS[card.attribute.toUpperCase()] ?? null) : null
  const isMonster  = card && card.atk !== null && card.atk !== undefined
  const frameLabel = FRAME_LABEL[frameType] ?? frameType

  return createPortal(
    <AnimatePresence>
      {open && card && (
        <>
          {/* ── Backdrop ───────────────────────────────────────── */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 50,
              background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(12px)',
            }}
            onClick={onClose}
          />

          {/* ── Panel wrapper ──────────────────────────────────── */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.88, y: 32 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{ opacity: 0, scale: 0.88, y: 32 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 50,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '12px', pointerEvents: 'none',
            }}
          >
            <div
              className="cdm-panel"
              onClick={(e) => e.stopPropagation()}
              style={{
                border: `1px solid ${glowColor}40`,
                boxShadow: `0 0 0 1px ${glowColor}20, 0 32px 64px rgba(0,0,0,0.7), 0 0 80px ${glowColor}18`,
              }}
            >
              {/* Top accent bar */}
              <div style={{
                height: '3px',
                background: `linear-gradient(90deg, transparent, ${glowColor}, transparent)`,
                borderRadius: '20px 20px 0 0',
              }} />

              {/* ── HEADER ─────────────────────────────────────── */}
              <div className="cdm-header">

                {/* Columna imagen */}
                <div
                  className="cdm-img-col"
                  style={{ borderRight: `1px solid ${glowColor}22` }}
                >
                  <div
                    className="cdm-img-wrap"
                    style={{
                      position: 'relative', borderRadius: '10px', overflow: 'hidden',
                      boxShadow: `0 0 32px ${glowColor}40, 0 8px 24px rgba(0,0,0,0.6)`,
                      border: `1px solid ${glowColor}50`,
                    }}
                  >
                    <img
                      src={card.image}
                      alt={card.name}
                      loading="lazy"
                      onError={(e) => { e.target.src = '/card-placeholder.png' }}
                    />
                    {/* Shimmer */}
                    <div style={{
                      position: 'absolute', inset: 0, pointerEvents: 'none',
                      background: `linear-gradient(135deg, ${glowColor}10 0%, transparent 60%)`,
                    }} />
                  </div>
                </div>

                {/* Columna info */}
                <div className="cdm-info-col">

                  {/* Tipo + Arquetipo */}
                  <div className="cdm-pills-row">
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
                      textTransform: 'uppercase', padding: '3px 10px', borderRadius: '99px',
                      background: `${typeMeta.accent}18`,
                      border: `1px solid ${typeMeta.accent}45`,
                      color: typeMeta.accent,
                    }}>
                      <span>{typeMeta.icon}</span>
                      {typeMeta.label}
                    </span>
                    {card.archetype && (
                      <span style={{
                        fontSize: '11px', color: '#a78bfa',
                        background: 'rgba(167,139,250,0.08)',
                        border: '1px solid rgba(167,139,250,0.2)',
                        padding: '3px 10px', borderRadius: '99px',
                      }}>
                        {card.archetype}
                      </span>
                    )}
                  </div>

                  {/* Nombre */}
                  <h2 className="cdm-card-name">{card.name}</h2>

                  {/* Atributo + Frame + Raza */}
                  <div className="cdm-pills-row">
                    {attrStyle && (
                      <span style={{
                        fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
                        textTransform: 'uppercase', padding: '3px 10px', borderRadius: '99px',
                        background: attrStyle.bg,
                        border: `1px solid ${attrStyle.border}`,
                        color: attrStyle.text,
                      }}>
                        {card.attribute}
                      </span>
                    )}
                    <span style={{
                      fontSize: '11px', color: '#94a3b8',
                      background: 'rgba(148,163,184,0.08)',
                      border: '1px solid rgba(148,163,184,0.15)',
                      padding: '3px 10px', borderRadius: '99px',
                    }}>
                      {frameLabel}
                    </span>
                    {card.race && (
                      <span style={{
                        fontSize: '11px', color: '#cbd5e1',
                        background: 'rgba(203,213,225,0.06)',
                        border: '1px solid rgba(203,213,225,0.15)',
                        padding: '3px 10px', borderRadius: '99px',
                      }}>
                        {card.race}
                      </span>
                    )}
                  </div>

                  {/* Divider */}
                  <div style={{ height: '1px', background: `linear-gradient(90deg, ${glowColor}40, transparent)` }} />

                  {/* Stats de monstruo */}
                  {isMonster && (
                    <div className="cdm-stats-row">
                      {card.atk !== null && (
                        <StatPill icon={<Sword style={{ width: 13, height: 13 }} />} label="ATK" value={card.atk} color="#f87171" />
                      )}
                      {card.def !== null && card.def !== undefined && (
                        <StatPill icon={<Shield style={{ width: 13, height: 13 }} />} label="DEF" value={card.def} color="#60a5fa" />
                      )}
                      {card.level && (
                        <StatPill icon={<Star style={{ width: 13, height: 13 }} />} label="Level" value={card.level} color="#fbbf24" />
                      )}
                      {card.linkval && (
                        <StatPill icon={<Link2 style={{ width: 13, height: 13 }} />} label="Link" value={card.linkval} color="#38bdf8" />
                      )}
                    </div>
                  )}

                  {/* Inventario y Carrito */}
                  <div className="cdm-inventory-row">
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '8px', padding: '5px 12px',
                      fontSize: '13px', fontWeight: 700, color: '#e2e8f0',
                    }}>
                      <Layers style={{ width: 14, height: 14, color: '#94a3b8' }} />
                      ×{card.quantity} en inventario
                    </span>
                    {card.rarity ? (
                      <Badge rarity={card.rarity} />
                    ) : (
                      <Badge condition={card.condition} />
                    )}

                    {isPublic && (
                      <button 
                        onClick={handleAddToCart}
                        className={`ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold text-xs transition-colors border ${
                          isMaxInCart 
                            ? 'bg-green-500/20 hover:bg-green-500/40 text-green-400 border-green-500/30 cursor-pointer' 
                            : isWishlist 
                              ? 'bg-purple-500 hover:bg-purple-400 text-white border-purple-500 cursor-pointer'
                              : 'bg-amber-500 hover:bg-amber-400 text-black border-amber-500 cursor-pointer'
                        }`}
                      >
                        {isMaxInCart ? (
                          <><Check style={{ width: 14, height: 14 }} /> {isWishlist ? 'Añadido' : 'Máximo añadido'}</>
                        ) : isWishlist ? (
                          <><ArrowRightLeft style={{ width: 14, height: 14 }} /> Ofrecer</>
                        ) : (
                          <><ShoppingCart style={{ width: 14, height: 14 }} /> Añadir</>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Botón cerrar */}
                <button
                  className="cdm-close-btn"
                  onClick={onClose}
                  aria-label="Cerrar"
                >
                  <X style={{ width: 15, height: 15 }} />
                </button>
              </div>

              {/* ── BODY ───────────────────────────────────────── */}
              <div
                className="cdm-body"
                style={{ borderTop: `1px solid ${glowColor}18` }}
              >
                {/* Detalles de la versión física del inventario */}
                {(card.setCode || card.setName || card.rarity || card.edition || card.language || card.setPrice || card.tcgPrice) && (
                  <div style={{ marginTop: '20px' }}>
                    <SectionLabel
                      icon={<Tag style={{ width: 12, height: 12 }} />}
                      text="Detalles de Colección"
                    />
                    <div style={{
                      marginTop: '10px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '10px',
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                        background: `linear-gradient(90deg, ${glowColor}60, transparent)`,
                      }} />
                      {card.setCode && (
                        <InfoChip
                          icon={<Tag style={{ width: 11, height: 11 }} />}
                          label="Set Code"
                          value={card.setCode}
                          color="#fbbf24"
                        />
                      )}
                      {card.rarity && (
                        <InfoChip
                          icon={<Sparkles style={{ width: 11, height: 11 }} />}
                          label="Rareza"
                          value={card.rarity}
                          color="#c084fc"
                        />
                      )}
                      {card.edition && (
                        <InfoChip
                          icon={<BookOpen style={{ width: 11, height: 11 }} />}
                          label="Edición"
                          value={card.edition}
                          color="#94a3b8"
                        />
                      )}
                      {card.language && (
                        <InfoChip
                          icon={<Globe style={{ width: 11, height: 11 }} />}
                          label="Idioma"
                          value={LANGUAGES.find(l => l.value === card.language)?.label || card.language}
                          color="#38bdf8"
                        />
                      )}
                      {card.setCode ? (
                        (card.setPrice && card.setPrice !== '0.00' && card.setPrice !== '0') ? (
                          <InfoChip
                            icon={<DollarSign style={{ width: 11, height: 11 }} />}
                            label="Precio Est."
                            value={`$${card.setPrice} USD`}
                            color="#34d399"
                          />
                        ) : (
                          <InfoChip
                            icon={<DollarSign style={{ width: 11, height: 11 }} />}
                            label="Precio Est."
                            value="N/D"
                            color="#f87171"
                          />
                        )
                      ) : (
                        (card.tcgPrice && card.tcgPrice !== '0.00' && card.tcgPrice !== '0') ? (
                          <InfoChip
                            icon={<DollarSign style={{ width: 11, height: 11 }} />}
                            label="TCGPlayer"
                            value={`$${card.tcgPrice} USD`}
                            color="#34d399"
                          />
                        ) : (
                          <InfoChip
                            icon={<DollarSign style={{ width: 11, height: 11 }} />}
                            label="Precio"
                            value="N/D"
                            color="#f87171"
                          />
                        )
                      )}
                      {card.setName && (
                        <div style={{ width: '100%', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          {card.setName}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {card.desc && (
                  <div style={{ marginTop: '20px' }}>
                    <SectionLabel
                      icon={<Sparkles style={{ width: 12, height: 12 }} />}
                      text="Descripción"
                    />
                    <div style={{
                      marginTop: '10px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                        background: `linear-gradient(90deg, ${glowColor}60, transparent)`,
                      }} />
                      <p style={{
                        margin: 0, fontSize: '13px', lineHeight: 1.75,
                        color: '#cbd5e1', whiteSpace: 'pre-line',
                      }}>
                        {card.desc}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom accent */}
              <div style={{
                height: '2px',
                background: `linear-gradient(90deg, transparent, ${glowColor}50, transparent)`,
                borderRadius: '0 0 20px 20px',
              }} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ icon, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
      {icon}
      <span style={{
        fontSize: '11px', fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>
        {text}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
    </div>
  )
}

function StatPill({ icon, label, value, color }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      background: `${color}10`, border: `1px solid ${color}35`,
      borderRadius: '10px', padding: '5px 11px',
    }}>
      <span style={{ color }}>{icon}</span>
      <span style={{ fontSize: '11px', color: `${color}cc`, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: '14px', fontWeight: 800, color, letterSpacing: '0.02em' }}>{value}</span>
    </div>
  )
}

function InfoChip({ icon, label, value, color }) {
  return (
    <div style={{
      display: 'inline-flex', flexDirection: 'column', gap: '2px',
      background: `${color}10`, border: `1px solid ${color}30`,
      borderRadius: '8px', padding: '6px 10px', minWidth: '80px',
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: `${color}99`, fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {icon} {label}
      </span>
      <span style={{ fontSize: '12px', fontWeight: 700, color }}>{value}</span>
    </div>
  )
}
