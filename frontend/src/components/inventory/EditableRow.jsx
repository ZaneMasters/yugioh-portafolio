import { useState } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { ConfirmDeleteModal } from '../ui/ConfirmDeleteModal'
import { CONDITIONS, RARITIES } from '../../utils/constants'
import { motion } from 'framer-motion'

export function EditableRow({ card, onEdit, onDelete, actionLoading, mode = 'inventory' }) {
  const [editing, setEditing]   = useState(false)
  const [qty, setQty]           = useState(card.quantity)
  const [cond, setCond]         = useState(card.condition || 'new')
  const [rarity, setRarity]     = useState(card.rarity || 'Common')
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSave = async () => {
    const payload = mode === 'inventory'
      ? { quantity: Number(qty), condition: cond }
      : { quantity: Number(qty), rarity: rarity }
    const ok = await onEdit(card.id, payload)
    if (ok) setEditing(false)
  }

  const handleCancel = () => {
    setEditing(false)
    setQty(card.quantity)
    setCond(card.condition || 'new')
    setRarity(card.rarity || 'Common')
  }

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete(card.id)
    setDeleting(false)
    setShowConfirm(false)
  }

  return (
    <>
      {/* ── Fila DESKTOP (md+): tabla real con 5 columnas ── */}
      <motion.tr
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="hidden md:table-row border-b border-white/5 hover:bg-white/[0.02] transition-colors"
      >
        {/* Carta */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <img
              src={card.image}
              alt={card.name}
              className="w-10 h-14 object-contain rounded bg-black/20 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-white line-clamp-2">{card.name}</p>
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
          {editing ? (
            mode === 'inventory' ? (
              <Select
                options={CONDITIONS}
                value={cond}
                onChange={(e) => setCond(e.target.value)}
                className="min-w-[160px]"
              />
            ) : (
              <Select
                options={RARITIES}
                value={rarity}
                onChange={(e) => setRarity(e.target.value)}
                className="min-w-[160px]"
              />
            )
          ) : (
            mode === 'inventory'
              ? <Badge condition={card.condition} />
              : <Badge rarity={card.rarity} />
          )}
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
                <Button variant="danger"    size="xs" icon={Trash2} loading={deleting} onClick={() => setShowConfirm(true)} />
              </>
            )}
          </div>
        </td>
      </motion.tr>

      {/* ── Tarjeta MÓVIL (< md): layout de card ── */}
      <motion.tr
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="md:hidden border-b border-white/5"
      >
        <td colSpan={5} className="p-4">
          <div className="flex gap-3">
            {/* Imagen */}
            <img
              src={card.image}
              alt={card.name}
              className="w-16 h-24 object-contain rounded bg-black/20 shrink-0"
            />

            {/* Contenido */}
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              {/* Nombre + tipo */}
              <div>
                <p className="text-sm font-semibold text-white line-clamp-2">{card.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{card.type}</p>
                {card.archetype && (
                  <p className="text-xs text-amber-400/70 mt-0.5">{card.archetype}</p>
                )}
              </div>

              {/* Cantidad + Condición */}
              <div className="flex items-center gap-3 flex-wrap">
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
                    <Select
                      options={CONDITIONS}
                      value={cond}
                      onChange={(e) => setCond(e.target.value)}
                      className="flex-1 min-w-[140px]"
                    />
                  ) : (
                    <Select
                      options={RARITIES}
                      value={rarity}
                      onChange={(e) => setRarity(e.target.value)}
                      className="flex-1 min-w-[140px]"
                    />
                  )
                ) : (
                  mode === 'inventory'
                    ? <Badge condition={card.condition} />
                    : <Badge rarity={card.rarity} />
                )}
              </div>

              {/* Botones */}
              <div className="flex items-center gap-1.5 mt-1">
                {editing ? (
                  <>
                    <Button variant="success" size="xs" icon={Check} loading={actionLoading} onClick={handleSave} />
                    <Button variant="ghost"   size="xs" icon={X}     onClick={handleCancel} />
                  </>
                ) : (
                  <>
                    <Button variant="secondary" size="xs" icon={Pencil} onClick={() => setEditing(true)}>Editar</Button>
                    <Button variant="danger"    size="xs" icon={Trash2} loading={deleting} onClick={() => setShowConfirm(true)}>Eliminar</Button>
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
}
