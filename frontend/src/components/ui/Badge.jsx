import { CONDITION_COLORS, CONDITIONS } from '../../utils/constants'

export function Badge({ condition }) {

  const label = CONDITIONS.find((c) => c.value === condition)?.label ?? condition
  const color = CONDITION_COLORS[condition] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30'

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      {label}
    </span>
  )
}
