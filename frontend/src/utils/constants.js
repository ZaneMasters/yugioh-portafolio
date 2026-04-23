// Condiciones válidas de carta
export const CONDITIONS = [
  { value: 'new', label: 'Nueva' },
  { value: 'near_mint', label: 'Near Mint' },
  { value: 'lightly_played', label: 'Lightly Played' },
  { value: 'moderately_played', label: 'Moderately Played' },
  { value: 'heavily_played', label: 'Heavily Played' },
  { value: 'damaged', label: 'Dañada' },
]

export const CONDITION_COLORS = {
  new:               'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  near_mint:         'bg-green-500/20 text-green-400 border-green-500/30',
  lightly_played:    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  moderately_played: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  heavily_played:    'bg-red-500/20 text-red-400 border-red-500/30',
  damaged:           'bg-rose-900/40 text-rose-400 border-rose-500/30',
}

export const CARD_TYPES = [
  'Normal Monster',
  'Effect Monster',
  'Ritual Monster',
  'Fusion Monster',
  'Synchro Monster',
  'XYZ Monster',
  'Link Monster',
  'Pendulum Effect Monster',
  'Spell Card',
  'Trap Card',
]

export const FRAME_TYPE_COLORS = {
  normal:   'from-yellow-900/40 to-yellow-700/20',
  effect:   'from-orange-900/40 to-orange-700/20',
  ritual:   'from-blue-900/40 to-blue-700/20',
  fusion:   'from-purple-900/40 to-purple-700/20',
  synchro:  'from-slate-700/40 to-slate-500/20',
  xyz:      'from-gray-900/60 to-gray-700/20',
  link:     'from-sky-900/40 to-sky-700/20',
  spell:    'from-teal-900/40 to-teal-700/20',
  trap:     'from-pink-900/40 to-pink-700/20',
}
