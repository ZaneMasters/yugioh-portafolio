import { useState, memo } from 'react'
import { Plus, Sword, Shield, Minus, ChevronDown } from 'lucide-react'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { CONDITIONS, RARITIES } from '../../utils/constants'

export const CardSearchResult = memo(function CardSearchResult({ card, destination = 'inventory', onAdd, adding, folders = [] }) {
  const [qty,      setQty]      = useState(1)
  const [cond,     setCond]     = useState('new')
  const [rarity,   setRarity]   = useState('Any')
  const [folderId, setFolderId] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  function handleAdd() {
    if (destination === 'inventory') {
      onAdd(card, qty, cond, folderId)
    } else {
      onAdd(card, qty, rarity)
    }
  }

  return (
    <div className="rounded-xl bg-[#1a2235] border border-white/5 group hover:border-amber-500/20 transition-all overflow-hidden">

      {/* ── Fila principal (siempre visible) ── */}
      <div className="flex items-center gap-2.5 p-2.5">
        {/* Imagen */}
        <div className="relative shrink-0 w-10 h-14 sm:w-14 sm:h-20 rounded-md overflow-hidden bg-black/30">
          <img
            src={card.imageSmall || card.image}
            alt={card.name}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            className={`w-full h-full object-contain transition-all duration-300 ${
              imgLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'
            }`}
            onError={(e) => { e.target.src = '/card-placeholder.png'; setImgLoaded(true); }}
          />
          {!imgLoaded && (
            <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center">
              <div className="w-4 h-6 sm:w-6 sm:h-8 bg-white/10 rounded-sm" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-white leading-tight line-clamp-2 group-hover:text-amber-400 transition-colors">
            {card.name}
          </p>
          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{card.type}</p>
          {/* Stats ATK/DEF — solo en desktop */}
          {(card.atk !== null || card.def !== null) && (
            <div className="hidden sm:flex gap-2 text-xs font-stat mt-0.5">
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

        {/* Controles compactos — siempre visibles */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Cantidad */}
          <div className="flex items-center gap-0.5 bg-black/30 rounded-lg border border-white/10 p-0.5">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white transition-colors rounded"
            >
              <Minus className="w-2.5 h-2.5" />
            </button>
            <span className="w-5 text-center text-xs font-stat text-white select-none">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(99, q + 1))}
              className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white transition-colors rounded"
            >
              <Plus className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Expandir opciones — solo mobile */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className={`sm:hidden w-7 h-7 flex items-center justify-center rounded-lg border transition-all ${
              expanded ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'border-white/10 text-slate-500 hover:text-slate-300'
            }`}
            title="Opciones"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>

          {/* Botón agregar */}
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            loading={adding}
            onClick={handleAdd}
            className="shrink-0 h-7 px-2 text-xs sm:px-3 sm:h-auto sm:text-sm"
          >
            <span className="hidden sm:inline">Agregar</span>
          </Button>
        </div>
      </div>

      {/* ── Opciones en desktop (siempre visibles) / mobile (colapsables) ── */}
      <div className={`px-2.5 pb-2.5 border-t border-white/5 pt-2 flex flex-wrap gap-2
        sm:flex
        ${expanded ? 'flex' : 'hidden sm:flex'}
      `}>
        {destination === 'inventory' ? (
          <>
            <div className="flex-1 min-w-[100px]">
              <Select
                options={CONDITIONS}
                value={cond}
                onChange={(e) => setCond(e.target.value)}
                placeholder="Condición"
                hidePlaceholderOption={true}
                title="Selecciona la condición física de la carta"
              />
            </div>
            {folders.length > 0 && (
              <div className="flex-1 min-w-[100px]">
                <Select
                  options={[{ value: '', label: 'Ninguna' }, ...folders.map(f => ({ value: f.id, label: f.name }))]}
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  placeholder="Carpeta"
                  hidePlaceholderOption={true}
                  title="Selecciona a qué carpeta agregar esta carta (Opcional)"
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 min-w-[100px]">
            <Select
              options={RARITIES}
              value={rarity}
              onChange={(e) => setRarity(e.target.value)}
              placeholder="Rareza deseada"
              hidePlaceholderOption={true}
              title="Selecciona en qué rareza estás buscando esta carta"
            />
          </div>
        )}
      </div>
    </div>
  )
})
