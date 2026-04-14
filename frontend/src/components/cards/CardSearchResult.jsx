import { motion } from 'framer-motion'
import { Plus, Sword, Shield, Star } from 'lucide-react'
import { Button } from '../ui/Button'

export function CardSearchResult({ card, onAdd, adding }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-[#1a2235] border border-white/5 group hover:border-amber-500/20 transition-all"
    >
      {/* Imagen */}
      <div className="shrink-0 w-14 h-20 rounded-lg overflow-hidden bg-black/30">
        <img
          src={card.image}
          alt={card.name}
          className="w-full h-full object-contain"
          onError={(e) => { e.target.src = '/card-placeholder.png' }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <p className="font-semibold text-sm text-white leading-tight line-clamp-2 group-hover:text-amber-400 transition-colors">
          {card.name}
        </p>
        <p className="text-xs text-slate-500 line-clamp-1">{card.type}</p>
        {card.archetype && (
          <p className="text-xs text-purple-400/70">{card.archetype}</p>
        )}
        {(card.atk !== null || card.def !== null) && (
          <div className="flex gap-2 text-xs">
            {card.atk !== null && (
              <span className="flex items-center gap-0.5 text-red-400">
                <Sword className="w-3 h-3" />{card.atk}
              </span>
            )}
            {card.def !== null && (
              <span className="flex items-center gap-0.5 text-sky-400">
                <Shield className="w-3 h-3" />{card.def}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Acción */}
      <Button
        variant="primary"
        size="sm"
        icon={Plus}
        loading={adding}
        onClick={() => onAdd(card)}
        className="shrink-0"
      >
        Agregar
      </Button>
    </motion.div>
  )
}
