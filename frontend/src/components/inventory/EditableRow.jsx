import { useState, memo } from 'react'
import { Pencil, Trash2, Check, X, Eye, EyeOff } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { ConfirmDeleteModal } from '../ui/ConfirmDeleteModal'
import { CONDITIONS, RARITIES } from '../../utils/constants'
import { motion } from 'framer-motion'

export const EditableRow = memo(function EditableRow({ card, onEdit, onDelete, actionLoading, mode = 'inventory', folders = [] }) {
  const [editing, setEditing]   = useState(false)
  const [qty, setQty]           = useState(card.quantity)
  const [cond, setCond]         = useState(card.condition || 'new')
  const [folderIds, setFolderIds] = useState(card.folderIds || [])
  const [rarity, setRarity]     = useState(card.rarity || 'Common')
  const [deleting, setDeleting] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSave = async () => {
    const numQty = Number(qty)
    const qtyChanged = numQty !== card.quantity
    let changed = false
    let payload = {}

    if (mode === 'inventory') {
      const origCond = card.condition || 'new'
      const origFolders = card.folderIds || []
      const currentFolders = folderIds || []
      
      const foldersChanged = origFolders.length !== currentFolders.length || !origFolders.every(f => currentFolders.includes(f))
      changed = qtyChanged || cond !== origCond || foldersChanged
      payload = { quantity: numQty, condition: cond, folderIds: currentFolders }
    } else {
      const origRarity = card.rarity || 'Common'
      changed = qtyChanged || rarity !== origRarity
      payload = { quantity: numQty, rarity }
    }

    if (!changed) {
      setEditing(false)
      return
    }

    const ok = await onEdit(card.id, payload)
    if (ok) setEditing(false)
  }

  const handleCancel = () => {
    setEditing(false)
    setQty(card.quantity)
    setCond(card.condition || 'new')
    setFolderIds(card.folderIds || [])
    setRarity(card.rarity || 'Common')
  }

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete(card.id)
    setDeleting(false)
    setShowConfirm(false)
  }

  const handleToggleVisibility = async () => {
    setToggling(true)
    await onEdit(card.id, { isHidden: !card.isHidden })
    setToggling(false)
  }

  return (
    <>
      {/* ── Fila DESKTOP (md+): tabla real con 5 columnas ── */}
      <motion.tr
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`hidden md:table-row border-b border-white/5 hover:bg-white/[0.02] transition-colors ${card.isHidden ? 'opacity-60 bg-white/[0.02]' : ''}`}
      >
        {/* Carta */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <img
              src={card.image}
              alt={card.name}
              className={`w-10 h-14 object-contain rounded bg-black/20 shrink-0 ${card.isHidden ? 'opacity-40 grayscale' : ''}`}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-white line-clamp-2">
                {card.name}
                {card.isHidden && <EyeOff className="inline w-3 h-3 ml-2 text-slate-400" />}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{card.type}</p>
            </div>
          </div>
        </td>

        {/* Arquetipo */}
        <td className="px-4 py-3 text-xs text-slate-400">
          {card.archetype || <span className="text-slate-600">—</span>}
        </td>

        {/* Cantidad */}
        <td className="px-4 py-3">
          {editing ? (
            <input
              type="number"
              min={0}
              max={999}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-16 bg-[#1f2937] border border-[#374151] rounded-md text-sm text-white
                         text-center px-2 py-1 outline-none focus:border-amber-500/60"
            />
          ) : (
            <span className="text-sm text-slate-200 font-stat">×{card.quantity}</span>
          )}
        </td>

        {/* Condición / Rareza */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {editing ? (
              mode === 'inventory' ? (
                <>
                  <Select
                    options={CONDITIONS}
                    value={cond}
                    onChange={(e) => setCond(e.target.value)}
                    className="min-w-[120px]"
                    hidePlaceholderOption
                  />
                  {folders.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 ml-2 border-l border-white/10 pl-2">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Carpetas:</span>
                      {folders.map(f => {
                        const isSelected = folderIds.includes(f.id)
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setFolderIds(prev => isSelected ? prev.filter(id => id !== f.id) : [...prev, f.id])}
                            className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border transition-colors ${
                              isSelected 
                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' 
                                : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-300'
                            }`}
                          >
                            {f.name}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Select
                  options={RARITIES}
                  value={rarity}
                  onChange={(e) => setRarity(e.target.value)}
                  className="min-w-[160px]"
                  hidePlaceholderOption
                />
              )
            ) : (
              mode === 'inventory'
                ? <Badge condition={card.condition} />
                : <Badge rarity={card.rarity} />
            )}
          </div>
        </td>

        {/* Acciones */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            {editing ? (
              <>
                <Button variant="success" size="xs" icon={Check} loading={actionLoading} onClick={handleSave} />
                <Button variant="ghost"   size="xs" icon={X}     onClick={handleCancel} />
              </>
            ) : (
              <>
                <Button variant="secondary" size="xs" icon={Pencil} onClick={() => setEditing(true)} />
                {mode === 'wishlist' && (
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={card.isHidden ? Eye : EyeOff}
                    loading={toggling}
                    onClick={handleToggleVisibility}
                    title={card.isHidden ? "Mostrar en wishlist pública" : "Ocultar de wishlist pública"}
                  />
                )}
                <Button variant="danger"    size="xs" icon={Trash2} loading={deleting} onClick={() => setShowConfirm(true)} />
              </>
            )}
          </div>
        </td>
      </motion.tr>

      {/* ── Tarjeta MÓVIL (<md): layout de card ── */}
      <motion.tr
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`md:hidden border-b border-white/5 ${card.isHidden ? 'opacity-60 bg-white/[0.02]' : ''}`}
      >
        <td colSpan={5} className="p-3">
          <div className="flex gap-3">
            {/* Imagen */}
            <img
              src={card.image}
              alt={card.name}
              className={`w-14 h-20 object-contain rounded bg-black/20 shrink-0 ${card.isHidden ? 'opacity-40 grayscale' : ''}`}
            />

            {/* Contenido */}
            <div className="flex-1 min-w-0 flex flex-col gap-2">

              {/* Fila 1: nombre + botón visibilidad (wishlist) */}
              <div className="flex items-start gap-1.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white leading-snug break-words">
                    {card.name}
                    {card.isHidden && <EyeOff className="inline w-3 h-3 ml-1.5 text-slate-400" />}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{card.type}</p>
                  {card.archetype && (
                    <p className="text-xs text-amber-400/70 mt-0.5 truncate">{card.archetype}</p>
                  )}
                </div>
                {/* Toggle visibilidad — solo wishlist, modo lectura */}
                {mode === 'wishlist' && !editing && (
                  <button
                    onClick={handleToggleVisibility}
                    disabled={toggling}
                    className={`shrink-0 p-1.5 rounded-lg border transition-all ${
                      card.isHidden
                        ? 'bg-slate-700/40 border-slate-600/40 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:text-slate-400 hover:border-slate-600/40'
                    }`}
                    title={card.isHidden ? 'Mostrar en wishlist pública' : 'Ocultar de wishlist pública'}
                  >
                    {toggling
                      ? <span className="w-3.5 h-3.5 block border-2 border-current border-t-transparent rounded-full animate-spin" />
                      : card.isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />
                    }
                  </button>
                )}
              </div>

              {/* Fila 2: cantidad + badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500">Cant:</span>
                  {editing ? (
                    <input
                      type="number"
                      min={0}
                      max={999}
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      className="w-14 bg-[#1f2937] border border-[#374151] rounded text-sm text-white
                                 text-center px-1.5 py-1 outline-none focus:border-amber-500/60"
                    />
                  ) : (
                    <span className="text-sm text-slate-200 font-medium">×{card.quantity}</span>
                  )}
                </div>

                {editing ? (
                  mode === 'inventory' ? (
                    <>
                      <Select
                        options={CONDITIONS}
                        value={cond}
                        onChange={(e) => setCond(e.target.value)}
                        className="flex-1 min-w-[100px]"
                        hidePlaceholderOption
                      />
                      {folders.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 w-full mt-1">
                          <span className="text-xs text-slate-500 w-full mb-0.5">Carpetas:</span>
                          {folders.map(f => {
                            const isSelected = folderIds.includes(f.id)
                            return (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => setFolderIds(prev => isSelected ? prev.filter(id => id !== f.id) : [...prev, f.id])}
                                className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border transition-colors ${
                                  isSelected 
                                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' 
                                    : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-300'
                                }`}
                              >
                                {f.name}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <Select
                      options={RARITIES}
                      value={rarity}
                      onChange={(e) => setRarity(e.target.value)}
                      className="flex-1 min-w-[130px]"
                      hidePlaceholderOption
                    />
                  )
                ) : (
                  mode === 'inventory'
                    ? <Badge condition={card.condition} />
                    : <Badge rarity={card.rarity} />
                )}
              </div>

              {/* Fila 3: botones editar / guardar / eliminar */}
              <div className="flex items-center gap-1.5">
                {editing ? (
                  <>
                    <Button variant="success" size="xs" icon={Check} loading={actionLoading} onClick={handleSave}>Guardar</Button>
                    <Button variant="ghost"   size="xs" icon={X}     onClick={handleCancel}>Cancelar</Button>
                  </>
                ) : (
                  <>
                    <Button variant="secondary" size="xs" icon={Pencil} onClick={() => setEditing(true)}>Editar</Button>
                    <Button variant="danger" size="xs" icon={Trash2} loading={deleting} onClick={() => setShowConfirm(true)}>Eliminar</Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </td>
      </motion.tr>

      <ConfirmDeleteModal
        open={showConfirm}
        cardName={card.name}
        cardImage={card.image}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  )
})
