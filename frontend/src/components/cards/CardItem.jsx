import { memo, useState } from 'react'
import { motion } from 'framer-motion'
import { FRAME_TYPE_COLORS } from '../../utils/constants'
import { Sword, Shield, Star, Layers, Eye, ShoppingCart, Check, ArrowRightLeft } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { useCartStore } from '../../store/useCartStore'
import { toast } from 'react-hot-toast'

export const CardItem = memo(function CardItem({ card, onSelect, viewMode, disableAnimation, isPublic, isWishlist }) {
  const frameGradient = FRAME_TYPE_COLORS[card.frameType] ?? FRAME_TYPE_COLORS.normal
  const isList = viewMode === 'list'
  const isGrid1 = viewMode === '1' || !viewMode  // 1 columna o desktop

  const [imgLoaded, setImgLoaded] = useState(false)
  const { items, addItem, removeItem } = useCartStore()
  
  const inCartItem = items.find(i => i.card.id === card.id && i.isWishlist === isWishlist)
  const isMaxInCart = isWishlist ? !!inCartItem : (inCartItem && inCartItem.cartQuantity >= card.quantity)

  const handleAddToCart = (e) => {
    e.stopPropagation()
    if (isMaxInCart) {
      removeItem(card.id, isWishlist)
      toast.success(isWishlist ? 'Removido de trades' : 'Removido del carrito', {
        icon: '🗑️',
        style: { background: '#333', color: '#fff' }
      })
    } else {
      addItem(card, isWishlist)
      toast.success(isWishlist ? 'Añadido a trades' : 'Añadido al carrito', {
        icon: isWishlist ? '🤝' : '🛒',
        style: { background: '#333', color: '#fff' }
      })
    }
  }

  const getFoilClass = (rarity) => {
    if (!rarity) return ''
    const r = rarity.toLowerCase()
    if (r.includes('secret') || r.includes('prismatic')) return 'foil-secret'
    if (r.includes('ultimate')) return 'foil-ultimate'
    if (r.includes('ultra')) return 'foil-ultra'
    if (r.includes('super')) return 'foil-super'
    return ''
  }

  const foilClass = getFoilClass(card.rarity)

  // Pill de cantidad
  const quantityPill = (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-xs text-white font-bold border border-white/10 whitespace-nowrap shrink-0">
      <Layers className="w-3 h-3 shrink-0" /> ×{card.quantity}
    </span>
  )

  // Badge de rareza o condición
  const rarityBadge = card.rarity
    ? <Badge rarity={card.rarity} />
    : card.condition
      ? <Badge condition={card.condition} />
      : null

  return (
    <motion.div
      layout={!disableAnimation}
      initial={disableAnimation ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={disableAnimation ? false : { opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={() => onSelect?.(card)}
      className={`
        group rounded-xl overflow-hidden border border-white/5
        bg-[#1a2235] card-glow cursor-pointer transition-shadow duration-300
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50
        ${isList
          ? `flex flex-row items-stretch bg-gradient-to-r ${frameGradient} sm:flex-col sm:bg-gradient-to-b`
          : `flex flex-col bg-gradient-to-b ${frameGradient}`
        }
      `}
    >
      {/* ── Imagen ── */}
      <div className={`relative shrink-0 flex justify-center bg-black/30 ${
        isList ? 'w-24 sm:w-auto sm:h-56' : 'h-56'
      }`}>
        {/* Badge SOLO en vista 1-columna: fuera de la carta, en la esquina superior derecha del fondo */}
        {isGrid1 && !isList && (
          <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end pointer-events-none">
            {quantityPill}
            {rarityBadge}
          </div>
        )}

        <div 
          className={`relative h-full aspect-[400/580] foil-wrapper overflow-hidden ${foilClass}`}
        >
          <img
            src={card.imageSmall || card.image}
            alt={card.name}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            className={`w-full h-full object-fill transition-all duration-500 group-hover:scale-105 relative z-0 ${
              imgLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'
            }`}
            onError={(e) => { e.target.onerror = null; e.target.src = '/card-placeholder.png'; setImgLoaded(true); }}
          />
          
          {/* Skeleton de carga mientras la imagen no esté lista */}
          {!imgLoaded && (
            <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center z-10">
              <div className="w-8 h-12 bg-white/10 rounded-sm" />
            </div>
          )}

          {/* Overlay interactivo */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex flex-col items-center justify-center gap-2 z-20 pointer-events-none group-hover:pointer-events-auto">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-xs text-white font-medium border border-white/20">
              <Eye className="w-3.5 h-3.5" /> Ver detalles
            </span>
            {isPublic && (
              <button 
                onClick={handleAddToCart}
                className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm text-xs font-bold border ${
                  isMaxInCart 
                    ? 'bg-green-500/20 hover:bg-green-500/40 text-green-400 border-green-500/30' 
                    : isWishlist 
                      ? 'bg-purple-500 hover:bg-purple-400 text-white border-purple-500'
                      : 'bg-amber-500 hover:bg-amber-400 text-black border-amber-500'
                }`}
              >
                {isMaxInCart ? (
                  <><Check className="w-3.5 h-3.5" /> {isWishlist ? 'Añadido' : 'Máximo añadido'}</>
                ) : isWishlist ? (
                  <><ArrowRightLeft className="w-3.5 h-3.5" /> Ofrecer</>
                ) : (
                  <><ShoppingCart className="w-3.5 h-3.5" /> Añadir al Carrito</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Info ── */}
      <div className={`p-3 flex flex-col gap-1.5 ${isList ? 'flex-1 min-w-0 overflow-hidden' : ''}`}>

        {/* Vista lista: nombre en su propia fila completa */}
        {isList && (
          <>
            <div className="flex items-start gap-1.5 justify-between">
              <h3 className="font-semibold text-sm text-white leading-snug line-clamp-3 group-hover:text-amber-400 transition-colors break-words flex-1 min-w-0">
                {card.name}
              </h3>
              {card.setCode && (
                <span className="shrink-0 mt-0.5 text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20 leading-none">
                  {card.setCode}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1 items-center mt-0.5">
              {quantityPill}
              {rarityBadge}
            </div>
          </>
        )}

        {/* Vista Cuadrícula (1 o 2 columnas): nombre + badge (solo si no es 1 columna) debajo del nombre */}
        {!isList && !isGrid1 && (
          <>
            <div className="flex items-start gap-1.5 justify-between">
              <h3 className="font-semibold text-sm text-white leading-tight line-clamp-2 group-hover:text-amber-400 transition-colors flex-1 min-w-0">
                {card.name}
              </h3>
              {card.setCode && (
                <span className="shrink-0 mt-0.5 text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20 leading-none">
                  {card.setCode}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1 items-center mt-0.5">
              {quantityPill}
              {rarityBadge}
            </div>
          </>
        )}

        {isGrid1 && !isList && (
          <div className="flex items-start gap-1.5 justify-between">
            <h3 className="font-semibold text-sm text-white leading-tight line-clamp-2 group-hover:text-amber-400 transition-colors flex-1 min-w-0">
              {card.name}
            </h3>
            {card.setCode && (
              <span className="shrink-0 mt-0.5 text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20 leading-none">
                {card.setCode}
              </span>
            )}
          </div>
        )}

        <p className="text-xs text-slate-500 line-clamp-1">{card.type}</p>

        {card.archetype && (
          <p className="text-xs text-purple-400/80">
            <span className="text-slate-600">Arquetipo:</span> {card.archetype}
          </p>
        )}
        <div className="mt-auto pt-1 flex justify-between items-end gap-2">
          {/* ATK / DEF — ocultos en lista y 2 columnas para ahorrar espacio */}
          {viewMode !== 'list' && viewMode !== '2' && (card.atk !== null || card.def !== null) ? (
            <div className="flex gap-3 text-xs">
              {card.atk !== null && (
                <span className="flex items-center gap-1 text-red-400">
                  <Sword className="w-3 h-3" /> {card.atk}
                </span>
              )}
              {card.def !== null && (
                <span className="flex items-center gap-1 text-sky-400">
                  <Shield className="w-3 h-3" /> {card.def}
                </span>
              )}
              {card.level && (
                <span className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3 h-3" /> {card.level}
                </span>
              )}
            </div>
          ) : <div />}

          {/* Mini-botón para móvil fuera de la imagen */}
          {isPublic && (
            <button
              onClick={handleAddToCart}
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md sm:hidden border shrink-0 transition-all active:scale-90 ${
                isMaxInCart 
                  ? 'bg-green-500/20 text-green-400 border-green-500/40' 
                  : isWishlist 
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              }`}
            >
              {isMaxInCart ? <Check className="w-4 h-4" /> : isWishlist ? <ArrowRightLeft className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
            </button>
          )}
        </div>

      </div>
    </motion.div>
  )
})
