import { motion } from 'framer-motion'
import { Badge } from '../ui/Badge'
import { FRAME_TYPE_COLORS } from '../../utils/constants'
import { Sword, Shield, Star, Layers } from 'lucide-react'

export function CardItem({ card }) {
  const frameGradient = FRAME_TYPE_COLORS[card.frameType] ?? FRAME_TYPE_COLORS.normal

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`
        group relative rounded-xl overflow-hidden border border-white/5
        bg-gradient-to-b ${frameGradient} bg-[#1a2235]
        card-glow cursor-default transition-shadow duration-300
      `}
    >
      {/* Imagen */}
      <div className="relative overflow-hidden h-56 bg-black/30">
        <img
          src={card.image}
          alt={card.name}
          loading="lazy"
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { e.target.src = '/card-placeholder.png' }}
        />
        {/* Quantity badge */}
        <div className="absolute top-2 right-2">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-xs text-white font-bold border border-white/10">
            <Layers className="w-3 h-3" /> ×{card.quantity}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-sm text-white leading-tight line-clamp-2 group-hover:text-amber-400 transition-colors">
          {card.name}
        </h3>

        <p className="text-xs text-slate-500 line-clamp-1">{card.type}</p>

        {card.archetype && (
          <p className="text-xs text-purple-400/80">
            <span className="text-slate-600">Arquetipo:</span> {card.archetype}
          </p>
        )}

        {/* ATK / DEF */}
        {(card.atk !== null || card.def !== null) && (
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
              <span className="flex items-center gap-1 text-amber-400 ml-auto">
                <Star className="w-3 h-3" /> {card.level}
              </span>
            )}
          </div>
        )}

        <div className="pt-1">
          <Badge condition={card.condition} />
        </div>
      </div>
    </motion.div>
  )
}
