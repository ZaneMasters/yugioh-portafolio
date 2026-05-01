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

// Valores enviados al backend como query param ?type=...
// El backend usa includes() para tipos que tienen múltiples subtipos (Pendulum, Ritual)
export const CARD_TYPES = [
  { label: 'Normal Monster',    value: 'Normal Monster'    },
  { label: 'Effect Monster',    value: 'Effect Monster'    },
  { label: 'Ritual Monster',    value: 'Ritual'            },
  { label: 'Fusion Monster',    value: 'Fusion Monster'    },
  { label: 'Synchro Monster',   value: 'Synchro Monster'   },
  { label: 'XYZ Monster',       value: 'XYZ Monster'       },
  { label: 'Link Monster',      value: 'Link Monster'      },
  { label: 'Pendulum Monster',  value: 'Pendulum'          },
  { label: 'Spell Card',        value: 'Spell Card'        },
  { label: 'Trap Card',         value: 'Trap Card'         },
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

export const RARITIES = [
  { value: 'Any', label: 'Cualquiera' },
  { value: 'Common', label: 'Common' },
  { value: 'Rare', label: 'Rare' },
  { value: 'Super Rare', label: 'Super Rare' },
  { value: 'Ultra Rare', label: 'Ultra Rare' },
  { value: 'Secret Rare', label: 'Secret Rare' },
  { value: 'Ultimate Rare', label: 'Ultimate Rare' },
  { value: 'Ghost Rare', label: 'Ghost Rare' },
  { value: 'Starlight Rare', label: 'Starlight Rare' },
  { value: 'Quarter Century Secret Rare', label: 'Quarter Century' },
  { value: 'Gold Rare', label: 'Gold Rare' },
]

export const RARITY_COLORS = {
  'Any':                         'bg-white/10 text-white border-white/20',
  'Common':                      'bg-slate-500/20 text-slate-400 border-slate-500/30',
  'Rare':                        'bg-zinc-300/20 text-zinc-300 border-zinc-300/30',
  'Super Rare':                  'bg-sky-500/20 text-sky-400 border-sky-500/30',
  'Ultra Rare':                  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Secret Rare':                 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30',
  'Ultimate Rare':               'bg-amber-700/20 text-amber-500 border-amber-700/30',
  'Ghost Rare':                  'bg-gray-100/20 text-gray-100 border-gray-100/30',
  'Starlight Rare':              'bg-indigo-400/20 text-indigo-300 border-indigo-400/30',
  'Quarter Century Secret Rare': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  'Gold Rare':                   'bg-yellow-400/20 text-yellow-300 border-yellow-400/30',
}
