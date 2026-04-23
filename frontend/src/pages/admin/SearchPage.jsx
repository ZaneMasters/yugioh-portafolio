import { useState, useEffect, useTransition } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Search, Loader2, PackagePlus } from 'lucide-react'
import { SearchInput } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { CardSearchResult } from '../../components/cards/CardSearchResult'
import { EmptyState } from '../../components/ui/EmptyState'
import { useSearchCards } from '../../hooks/useSearchCards'
import { useCards } from '../../hooks/useCards'
import { useDebounce } from '../../hooks/useDebounce'
import { CONDITIONS } from '../../utils/constants'

const MAX_VISIBLE = 20

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [addingId, setAddingId] = useState(null)
  const [isPending, startTransition] = useTransition()

  // Config de cantidad/condición default al agregar
  const [defaultQty, setDefaultQty] = useState(1)
  const [defaultCond, setDefaultCond] = useState('new')

  const debouncedQuery = useDebounce(query, 650)
  const { results, searching, search } = useSearchCards()
  const { addCard } = useCards()

  useEffect(() => {
    // La búsqueda de red ocurre fuera de la transición para que el spinner
    // aparezca rápido, pero el renderizado de la lista es de baja prioridad
    startTransition(() => {
      search(debouncedQuery)
    })
  }, [debouncedQuery])

  const handleAdd = async (card) => {
    setAddingId(card.cardId)
    await addCard({
      cardId: card.cardId,
      condition: defaultCond,
      quantity: defaultQty,
    })
    setAddingId(null)
  }

  const visibleResults = results.slice(0, MAX_VISIBLE)
  const hiddenCount = results.length - visibleResults.length

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Buscar Cartas</h1>
        <p className="text-slate-400 text-sm">
          Busca cartas en la base de datos de YGOProdeck y agrégalas a tu inventario.
          <br />
          <span className="text-amber-500/90 text-xs font-medium">Nota: Las búsquedas deben realizarse con el nombre de la carta en Inglés.</span>
        </p>
      </div>

      {/* Barra de búsqueda */}
      <div className="glass rounded-xl p-4 mb-6 space-y-4">
        <SearchInput
          placeholder="Escribe el nombre en inglés... (ej: Dark Magician)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        {/* Opciones default al agregar */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 whitespace-nowrap">Cantidad:</label>
            <input
              type="number"
              min={1}
              max={99}
              value={defaultQty}
              onChange={(e) => setDefaultQty(Number(e.target.value))}
              className="w-16 bg-[#1f2937] border border-[#374151] rounded-md text-sm text-white text-center
                         px-2 py-1.5 outline-none focus:border-amber-500/60"
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <Select
              options={CONDITIONS}
              value={defaultCond}
              onChange={(e) => setDefaultCond(e.target.value)}
              placeholder="Condición al agregar"
            />
          </div>
        </div>
      </div>

      {/* Resultados */}
      {searching || isPending ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-slate-500 text-sm">Buscando en YGOProdeck...</p>
        </div>
      ) : query.trim().length > 0 && results.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Sin resultados"
          description={`No se encontraron cartas con "${query}". Intenta con otro nombre.`}
        />
      ) : results.length === 0 ? (
        <EmptyState
          icon={PackagePlus}
          title="Escribe para buscar"
          description="Ingresa al menos 2 caracteres para empezar a buscar cartas."
        />
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 mb-3">
            {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
            {hiddenCount > 0 && ` — mostrando los primeros ${MAX_VISIBLE}`}
          </p>
          <AnimatePresence>
            {visibleResults.map((card) => (
              <CardSearchResult
                key={card.cardId}
                card={card}
                onAdd={handleAdd}
                adding={addingId === card.cardId}
              />
            ))}
          </AnimatePresence>
          {hiddenCount > 0 && (
            <p className="text-center text-xs text-slate-600 pt-2">
              + {hiddenCount} resultados más — refina tu búsqueda para encontrar la carta exacta.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
