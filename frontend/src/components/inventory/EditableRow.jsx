import { useState } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { ConfirmDeleteModal } from '../ui/ConfirmDeleteModal'
import { CONDITIONS } from '../../utils/constants'
import { motion } from 'framer-motion'

export function EditableRow({ card, onEdit, onDelete, actionLoading }) {
  const [editing, setEditing] = useState(false)
  const [qty, setQty] = useState(card.quantity)
  const [cond, setCond] = useState(card.condition)
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSave = async () => {
    const ok = await onEdit(card.id, { quantity: Number(qty), condition: cond })
    if (ok) setEditing(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete(card.id)
    setDeleting(false)
    setShowConfirm(false)
  }

  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col md:table-row border-b border-white/5 hover:bg-white/[0.02] transition-colors p-4 md:p-0 gap-3 md:gap-0"
    >
      {/* Imagen + Nombre */}
      <td className="md:px-4 md:py-3 block md:table-cell">
        <div className="flex items-start md:items-center gap-3">
          <img
            src={card.image}
            alt={card.name}
            className="w-16 h-24 md:w-10 md:h-14 object-contain rounded bg-black/20 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white line-clamp-2">{card.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">{card.type}</p>
            {/* Arquetipo (solo en móvil) */}
            <p className="text-xs text-amber-400/70 mt-1 md:hidden">
              {card.archetype || 'Sin Arquetipo'}
            </p>
          </div>
        </div>
      </td>

      {/* Arquetipo (solo en desktop) */}
      <td className="hidden md:table-cell px-4 py-3 text-xs text-slate-400">
        {card.archetype || <span className="text-slate-600">—</span>}
      </td>

      {/* Acciones y Detalles (móvil y desktop) */}
      <td className="block md:table-cell md:px-4 md:py-3" colSpan="3">
        <div className="flex items-center justify-between md:justify-start gap-4 md:gap-0 md:contents">
          {/* Cantidad */}
          <div className="flex items-center gap-2 md:table-cell md:px-4 md:py-3">
            <span className="text-xs text-slate-500 md:hidden">Cant:</span>
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
          </div>

          {/* Condición */}
          <div className="flex items-center gap-2 md:table-cell md:px-4 md:py-3">
            {editing ? (
              <Select
                options={CONDITIONS}
                value={cond}
                onChange={(e) => setCond(e.target.value)}
                className="text-xs py-1.5 w-full md:w-auto"
              />
            ) : (
              <Badge condition={card.condition} />
            )}
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-end gap-1.5 md:table-cell md:px-4 md:py-3">
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
                    onClick={() => setShowConfirm(true)}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </td>
      <ConfirmDeleteModal
        open={showConfirm}
        cardName={card.name}
        cardImage={card.image}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </motion.tr>
  )
}
