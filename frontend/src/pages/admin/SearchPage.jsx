import { useState, useEffect, useTransition } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Loader2, PackagePlus, ChevronLeft, ChevronRight } from 'lucide-react'
import { SearchInput } from '../../components/ui/Input'
import { CardSearchResult } from '../../components/cards/CardSearchResult'
import { EmptyState } from '../../components/ui/EmptyState'
import { useSearchCards } from '../../hooks/useSearchCards'
import { useCards } from '../../hooks/useCards'
import { useWishlist } from '../../hooks/useWishlist'
import { useDebounce } from '../../hooks/useDebounce'
import { useFolders } from '../../hooks/useFolders'

const PAGE_SIZE = 10 // resultados por página

export default function SearchPage() {
  const [query, setQuery]       = useState('')
  const [addingId, setAddingId] = useState(null)
  const [isPending, startTransition] = useTransition()
  const [destination, setDestination] = useState('inventory') // 'inventory' | 'wishlist'
  const [page, setPage]         = useState(1)

  const debouncedQuery          = useDebounce(query, 650)
  const { results, searching, search } = useSearchCards()
  const { addCard: addCardInventory }  = useCards()
  const { addCard: addCardWishlist }   = useWishlist()
  
  const { folders, fetchFolders } = useFolders()

  useEffect(() => {
    fetchFolders()
  }, [])

  // Reiniciar paginación cuando cambia la búsqueda o el destino
  useEffect(() => { setPage(1) }, [debouncedQuery, destination])

  useEffect(() => {
    startTransition(() => { search(debouncedQuery) })
  }, [debouncedQuery])

  const handleAdd = async (card, qty, condOrRarity, folderId) => {
    setAddingId(card.cardId)
    if (destination === 'inventory') {
      const payload = { cardId: card.cardId, condition: condOrRarity, quantity: qty }
      if (folderId) payload.folderId = folderId;
      await addCardInventory(payload)
    } else {
      await addCardWishlist({ cardId: card.cardId, rarity: condOrRarity, quantity: qty })
    }
    setAddingId(null)
  }

  // Paginación
  const totalPages   = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const safePage     = Math.min(page, totalPages)
  const pageStart    = (safePage - 1) * PAGE_SIZE
  const pageResults  = results.slice(pageStart, pageStart + PAGE_SIZE)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Buscar Cartas</h1>
        <p className="text-slate-400 text-sm">
          Busca cartas en la base de datos de YGOProdeck y agrégalas a tu inventario.
          <br />
          <span className="text-amber-500/90 text-xs font-medium">
            Nota: Las búsquedas deben realizarse con el nombre de la carta en Inglés.
          </span>
        </p>
      </div>

      {/* Barra de búsqueda + Toggle destino */}
      <div className="glass rounded-xl p-4 mb-6 space-y-4">
        <SearchInput
          placeholder="Escribe el nombre en inglés... (ej: Dark Magician)"
          value={query}
          onChange={(e) => { setQuery(e.target.value) }}
          autoFocus
        />

        {/* Toggle Inventario / Wishlist */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 shrink-0">Agregar a:</span>
          <div className="flex bg-[#111827] rounded-lg p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setDestination('inventory')}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
                destination === 'inventory'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Inventario
            </button>
            <button
              type="button"
              onClick={() => setDestination('wishlist')}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
                destination === 'wishlist'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Wishlist
            </button>
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
          {/* Contador */}
          <p className="text-xs text-slate-500 mb-3">
            {results.length} resultado{results.length !== 1 ? 's' : ''} —&nbsp;
            página {safePage} de {totalPages}
          </p>

          {/* Lista paginada */}
          <AnimatePresence mode="wait">
            <motion.div
              key={safePage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-2"
            >
              {pageResults.map((card) => (
                <CardSearchResult
                  key={card.cardId}
                  card={card}
                  destination={destination}
                  onAdd={handleAdd}
                  adding={addingId === card.cardId}
                  folders={folders}
                />
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                type="button"
                disabled={safePage === 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-white/10
                           text-slate-400 hover:text-white hover:border-amber-500/40 transition-all
                           disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-white/10
                           disabled:hover:text-slate-400"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>

              {/* Números de página */}
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    // Mostrar siempre: primera, última, y las 2 adyacentes a la actual
                    return (
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - safePage) <= 1
                    )
                  })
                  .reduce((acc, p, idx, arr) => {
                    // Insertar "..." cuando hay salto
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((item, idx) =>
                    item === '...' ? (
                      <span key={`dots-${idx}`} className="px-2 py-2 text-slate-600 text-sm select-none">
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPage(item)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                          item === safePage
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
              </div>

              <button
                type="button"
                disabled={safePage === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-white/10
                           text-slate-400 hover:text-white hover:border-amber-500/40 transition-all
                           disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-white/10
                           disabled:hover:text-slate-400"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
