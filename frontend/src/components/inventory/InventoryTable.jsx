import { AnimatePresence } from 'framer-motion'
import { EditableRow } from './EditableRow'
import { TableRowSkeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'
import { Package } from 'lucide-react'

const HEADERS = ['Carta', 'Arquetipo', 'Cantidad', 'Condición', 'Acciones']

export function InventoryTable({ cards, loading, onEdit, onDelete, actionLoading }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#111827]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/5 bg-white/[0.02]">
            {HEADERS.map((h) => (
              <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)
          ) : cards.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <EmptyState
                  icon={Package}
                  title="Inventario vacío"
                  description="Busca y agrega cartas desde el buscador."
                />
              </td>
            </tr>
          ) : (
            <AnimatePresence>
              {cards.map((card) => (
                <EditableRow
                  key={card.id}
                  card={card}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  actionLoading={actionLoading}
                />
              ))}
            </AnimatePresence>
          )}
        </tbody>
      </table>
    </div>
  )
}
