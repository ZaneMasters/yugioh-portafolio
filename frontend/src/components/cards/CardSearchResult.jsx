import { useState } from 'react'
import { Plus, Sword, Shield, Minus } from 'lucide-react'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { CONDITIONS, RARITIES } from '../../utils/constants'

/**
 * Tarjeta de resultado de búsqueda para el panel de admin.
 *
 * Incluye controles inline de cantidad y condición/rareza por cada carta,
 * de modo que el usuario puede configurar cada una antes de agregarla.
 *
 * Props:
 *  - card        {object}   — datos de la carta (YGOProdeck)
 *  - destination {'inventory'|'wishlist'} — destino de la carta al agregar
 *  - onAdd       {fn}       — callback (card, qty, cond|rarity)
 *  - adding      {boolean}  — si esta carta está siendo agregada ahora
 */
export function CardSearchResult({ card, destination = 'inventory', onAdd, adding }) {
  const [qty,    setQty]    = useState(1)
  const [cond,   setCond]   = useState('new')
  const [rarity, setRarity] = useState('Any')

  function handleAdd() {
    if (destination === 'inventory') {
      onAdd(card, qty, cond)
    } else {
      onAdd(card, qty, rarity)
    }
  }

  return (
    <div className="flex flex-col gap-3 p-3 rounded-xl bg-[#1a2235] border border-white/5 group hover:border-amber-500/20 transition-all">
      {/* Fila principal: imagen + info + botón */}
      <div className="flex items-center gap-3">
        {/* Imagen */}
        <div className="shrink-0 w-14 h-20 rounded-lg overflow-hidden bg-black/30">
          <img
            src={card.imageSmall || card.image}
            alt={card.name}
            loading="lazy"
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
            <div className="flex gap-2 text-xs font-stat">
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

        {/* Botón agregar */}
        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          loading={adding}
          onClick={handleAdd}
          className="shrink-0 self-start"
        >
          Agregar
        </Button>
      </div>

      {/* Controles inline: cantidad + condición/rareza */}
      <div className="flex items-center gap-3 flex-wrap border-t border-white/5 pt-2.5">
        {/* Cantidad */}
        <div className="flex items-center gap-1.5 bg-[#111827] rounded-lg border border-white/10 p-0.5">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white transition-colors rounded-md hover:bg-white/5"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-7 text-center text-sm font-stat text-white select-none">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(99, q + 1))}
            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white transition-colors rounded-md hover:bg-white/5"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Condición o Rareza según destino */}
        <div className="flex-1 min-w-[160px]">
          {destination === 'inventory' ? (
            <Select
              options={CONDITIONS}
              value={cond}
              onChange={(e) => setCond(e.target.value)}
              placeholder="Condición"
            />
          ) : (
            <Select
              options={RARITIES}
              value={rarity}
              onChange={(e) => setRarity(e.target.value)}
              placeholder="Rareza deseada"
            />
          )}
        </div>
      </div>
    </div>
  )
}
