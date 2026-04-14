import { useState } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { CONDITIONS } from '../../utils/constants'
import { motion } from 'framer-motion'

export function EditableRow({ card, onEdit, onDelete, actionLoading }) {
  const [editing, setEditing] = useState(false)
  const [qty, setQty] = useState(card.quantity)
  const [cond, setCond] = useState(card.condition)
  const [deleting, setDeleting] = useState(false)

  const handleSave = async () => {
    const ok = await onEdit(card.id, { quantity: Number(qty), condition: cond })
    if (ok) setEditing(false)
  }

  const handleDelete = async () => {
    if (!window.confirm(`¿Eliminar "${card.name}" del inventario?`)) return
    setDeleting(true)
    await onDelete(card.id)
    setDeleting(false)
  }

  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
    >
      {/* Imagen + Nombre */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <img
            src={card.image}
            alt={card.name}
            className="w-10 h-14 object-contain rounded bg-black/20 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-white line-clamp-2">{card.name}</p>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{card.type}</p>
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
            className="w-16 bg-[#1f2937] border border-[#374151] rounded-md text-sm text-white text-center
                       px-2 py-1 outline-none focus:border-amber-500/60"
          />
        ) : (
          <span className="text-sm text-slate-200 font-medium">×{card.quantity}</span>
        )}
      </td>

      {/* Condición */}
      <td className="px-4 py-3">
        {editing ? (
          <Select
            options={CONDITIONS}
            value={cond}
            onChange={(e) => setCond(e.target.value)}
            className="text-xs py-1.5"
          />
        ) : (
          <Badge condition={card.condition} />
        )}
      </td>

      {/* Acciones */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          {editing ? (
            <>
              <Button
                variant="success"
                size="xs"
                icon={Check}
                loading={actionLoading}
                onClick={handleSave}
              />
              <Button
                variant="ghost"
                size="xs"
                icon={X}
                onClick={() => { setEditing(false); setQty(card.quantity); setCond(card.condition) }}
              />
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                size="xs"
                icon={Pencil}
                onClick={() => setEditing(true)}
              />
              <Button
                variant="danger"
                size="xs"
                icon={Trash2}
                loading={deleting}
                onClick={handleDelete}
              />
            </>
          )}
        </div>
      </td>
    </motion.tr>
  )
}
