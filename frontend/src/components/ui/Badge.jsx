import { CONDITION_COLORS, CONDITIONS, RARITIES, RARITY_COLORS } from '../../utils/constants'

export function Badge({ condition, rarity }) {
  let label = ''
  let color = 'bg-slate-500/20 text-slate-400 border-slate-500/30'

  if (rarity) {
    label = RARITIES.find((r) => r.value === rarity)?.label ?? rarity
    color = RARITY_COLORS[rarity] ?? color
  } else if (condition) {
    label = CONDITIONS.find((c) => c.value === condition)?.label ?? condition
    color = CONDITION_COLORS[condition] ?? color
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      {label}
    </span>
  )
}

