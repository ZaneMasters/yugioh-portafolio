import { useState, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Loader2, PackagePlus, ChevronLeft, ChevronRight, ServerCrash, RefreshCw, AlertCircle, Info, Sword, Wand2, Shield, LayoutGrid } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { CardSearchResult } from '../../components/cards/CardSearchResult'
import { EmptyState } from '../../components/ui/EmptyState'
import { useSearchCards } from '../../hooks/useSearchCards'
import { useCards } from '../../hooks/useCards'
import { useWishlist } from '../../hooks/useWishlist'
import { useFolders } from '../../hooks/useFolders'
import { useDebounce } from '../../hooks/useDebounce'
import { getCatalogStatus } from '../../services/externalService'

const PAGE_SIZE = 10 // resultados por página

const CARD_TYPE_FILTERS = [
  {
    value: 'all',
    label: 'Todas',
    icon: LayoutGrid,
    activeClass: 'bg-slate-600/40 text-slate-200 border-slate-500/50 shadow-inner',
    inactiveClass: 'text-slate-500 border-white/5 hover:text-slate-300 hover:border-white/15 hover:bg-white/5',
  },
  {
    value: 'monster',
    label: 'Monstruos',
    icon: Sword,
    activeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-inner shadow-amber-500/10',
    inactiveClass: 'text-slate-500 border-white/5 hover:text-amber-400/70 hover:border-amber-500/20 hover:bg-amber-500/5',
  },
  {
    value: 'spell',
    label: 'Magias',
    icon: Wand2,
    activeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-inner shadow-emerald-500/10',
    inactiveClass: 'text-slate-500 border-white/5 hover:text-emerald-400/70 hover:border-emerald-500/20 hover:bg-emerald-500/5',
  },
  {
    value: 'trap',
    label: 'Trampas',
    icon: Shield,
    activeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-inner shadow-rose-500/10',
    inactiveClass: 'text-slate-500 border-white/5 hover:text-rose-400/70 hover:border-rose-500/20 hover:bg-rose-500/5',
  },
]

export default function SearchPage() {
  const [queryInput, setQueryInput] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [searchType, setSearchType] = useState('name') // 'name' | 'archetype' | 'set'
  const [filterType, setFilterType] = useState('all') // 'all' | 'monster' | 'spell' | 'trap'

  const [addingId, setAddingId] = useState(null)
  const [destination, setDestination] = useState('inventory') // 'inventory' | 'wishlist'
  const [page, setPage]         = useState(1)
  const [catalogStatus, setCatalogStatus] = useState(null)

  const debouncedQueryInputRaw = useDebounce(queryInput, 650)
  const debouncedQueryInput = queryInput === '' ? '' : debouncedQueryInputRaw

  // Cargar estado del catálogo al montar
  useEffect(() => {
    let mounted = true
    getCatalogStatus()
      .then(res => {
        if (mounted && res.data) setCatalogStatus(res.data)
      })
      .catch(err => console.error('Error fetching catalog status', err))
    return () => { mounted = false }
  }, [])

  // Búsqueda automática basada en debouncedQueryInput
  useEffect(() => {
    const minChars = searchType === 'set' ? 4 : 3;
    if (debouncedQueryInput.trim().length === 0 || debouncedQueryInput.trim().length >= minChars) {
      setActiveQuery(debouncedQueryInput.trim());
    }
  }, [debouncedQueryInput, searchType])

  const { results: rawResults, searching, searchError } = useSearchCards(activeQuery, searchType)
  const { addCard: addCardInventory }         = useCards()
  const { addCard: addCardWishlist }          = useWishlist()
  const { folders }                           = useFolders()
  const queryClient                           = useQueryClient()

  // Filtrado local por tipo de carta (muy útil para arquetipos que traen todo mezclado)
  const results = useMemo(() => {
    if (filterType === 'all') return rawResults;
    return rawResults.filter((card) => {
      const typeStr = (card.type || '').toLowerCase();
      if (filterType === 'monster') return typeStr.includes('monster');
      if (filterType === 'spell') return typeStr.includes('spell');
      if (filterType === 'trap') return typeStr.includes('trap');
      return true;
    });
  }, [rawResults, filterType]);

  // Extraer arquetipos únicos de los resultados actuales
  const matchedArchetypes = useMemo(() => {
    if (searchType !== 'archetype' || results.length === 0) return [];
    const archs = new Set();
    results.forEach(card => {
      if (card.archetype) archs.add(card.archetype);
    });
    return Array.from(archs).sort();
  }, [results, searchType]);

  // Reiniciar paginación cuando cambia la búsqueda, tipo, filtro o el destino
  useEffect(() => { setPage(1) }, [activeQuery, searchType, filterType, destination])

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const minChars = searchType === 'set' ? 4 : 3;
    if (queryInput.trim().length >= minChars) {
      setActiveQuery(queryInput.trim());
    }
  }

  const handleAdd = async (card, qty, condOrRarity, folderId, extraPayload = {}) => {
    setAddingId(card.cardId)
    if (destination === 'inventory') {
      const payload = { cardId: card.cardId, condition: condOrRarity, quantity: qty, ...extraPayload }
      if (folderId) payload.folderIds = [folderId];
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
        <div className="text-slate-400 text-sm flex flex-col gap-1">
          {catalogStatus ? (
            <div className="flex flex-col gap-0.5 mt-1">
              <span className="text-emerald-500/80 font-medium flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                Motor de Búsqueda Local Activo
              </span>
              <span className="text-xs text-slate-400">
                Última actualización: {new Date(catalogStatus.lastUpdated).toLocaleString()} 
                {' '}• Origen: {catalogStatus.source} 
                {' '}• Cartas: {catalogStatus.totalCards.toLocaleString()}
              </span>
            </div>
          ) : (
            <span>Conectando con el catálogo local...</span>
          )}
          <span className="text-amber-500/90 text-xs font-medium mt-1">
            Nota: Las búsquedas deben realizarse con el nombre de la carta en Inglés.
          </span>
        </div>
      </div>

      {/* Caja Principal Unificada */}
      <div className="glass rounded-2xl p-5 mb-8 flex flex-col gap-5 shadow-xl shadow-black/20">
        
        {/* Fila Superior: Modos y Destino */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          
          {/* Tabs Minimalistas (Nombre vs Arquetipo vs Set) */}
          <div className="flex items-center gap-6 border-b border-white/5 px-2">
            <button
              type="button"
              onClick={() => { setSearchType('name'); setQueryInput(''); setActiveQuery(''); setFilterType('all'); }}
              className={`pb-2 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
                searchType === 'name' 
                  ? 'border-amber-500 text-amber-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Por Nombre
            </button>
            <button
              type="button"
              onClick={() => { setSearchType('archetype'); setQueryInput(''); setActiveQuery(''); }}
              className={`pb-2 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
                searchType === 'archetype' 
                  ? 'border-amber-500 text-amber-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Por Arquetipo
            </button>
            <button
              type="button"
              onClick={() => { setSearchType('set'); setQueryInput(''); setActiveQuery(''); setFilterType('all'); }}
              className={`pb-2 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
                searchType === 'set' 
                  ? 'border-amber-500 text-amber-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Por Set
            </button>
          </div>

          {/* Toggle Inventario / Wishlist */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Destino:</span>
            <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
              <button
                type="button"
                onClick={() => setDestination('inventory')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  destination === 'inventory'
                    ? 'bg-amber-500/20 text-amber-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                Inventario
              </button>
              <button
                type="button"
                onClick={() => setDestination('wishlist')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  destination === 'wishlist'
                    ? 'bg-amber-500/20 text-amber-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                Wishlist
              </button>
            </div>
          </div>
        </div>

        {/* Fila Inferior: Input y Búsqueda */}
        <form 
          onSubmit={handleSearchSubmit} 
          className="flex flex-row items-center bg-black/20 rounded-xl border border-white/5 p-1 gap-2 focus-within:bg-black/40 focus-within:border-amber-500/30 transition-all"
        >
          {/* Input Integrado */}
          <div className="flex-1 relative flex items-center px-4 py-3 md:py-0 md:h-[44px]">
            <Search className={`w-4 h-4 mr-3 shrink-0 transition-colors ${searchType === 'archetype' && activeQuery.trim().length === 0 ? 'text-amber-500/50' : 'text-slate-500'}`} />
            <input
              placeholder={searchType === 'name'
                ? 'Escribe el nombre en inglés... (ej: Dark Magician)'
                : searchType === 'archetype'
                  ? 'Escribe el arquetipo en inglés... (ej: Salamangreat)'
                  : 'Escribe el nombre del set... (ej: Maximum Gold, MAGO)'}
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-slate-100 text-sm placeholder:text-slate-600 font-medium"
              autoFocus
            />
          </div>
        </form>

        {/* Filtros de tipo y arquetipos — visible solo en modo arquetipo */}
        <AnimatePresence>
          {searchType === 'archetype' && (
            <motion.div
              key="archetype-filters"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-3 pt-3 border-t border-white/5">
                
                {/* Pills de tipo de carta */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mr-1 shrink-0">
                    Tipo:
                  </span>
                  {CARD_TYPE_FILTERS.map(({ value, label, icon: Icon, activeClass, inactiveClass }) => (
                    <motion.button
                      key={value}
                      type="button"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setFilterType(value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                        filterType === value ? activeClass : inactiveClass
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {label}
                      {value !== 'all' && filterType === value && rawResults.length > 0 && (
                        <span className="ml-0.5 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-white/10">
                          {results.length}
                        </span>
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* Tags de arquetipos encontrados */}
                {matchedArchetypes.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mr-1 shrink-0">
                      Arquetipos:
                    </span>
                    {matchedArchetypes.map(arch => (
                      <span
                        key={arch}
                        className="px-2 py-1 text-[10px] font-bold tracking-wide uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md"
                      >
                        {arch}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Resultados */}
      {searching ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-slate-500 text-sm">Buscando en YGOProdeck...</p>
        </div>
      ) : searchError ? (
        /* ── Error de la API externa ── */
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center py-14 gap-4 text-center"
        >
          {searchError.status === 400 ? (
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-amber-400" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <ServerCrash className="w-8 h-8 text-red-400" />
            </div>
          )}
          <div>
            <p className="text-white font-semibold mb-1">
              {searchError.status === 400 ? 'Búsqueda muy genérica' : 'La API de YGOProdeck está caída'}
            </p>
            <p className="text-slate-400 text-sm max-w-sm">
              {searchError.message || 'El servicio externo no responde. Intenta de nuevo en unos minutos.'}
            </p>
          </div>
          {searchError.status !== 400 && (
            <button
              type="button"
              onClick={() => queryClient.resetQueries({ queryKey: ['search', activeQuery, searchType, 'en'] })}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg
                         bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30
                         text-slate-300 hover:text-white transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Intentar de nuevo
            </button>
          )}
        </motion.div>
      ) : activeQuery.trim().length > 0 && results.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Sin resultados"
          description={
            rawResults.length > 0 
              ? `No se encontraron cartas del tipo seleccionado para "${activeQuery}".`
              : `No se encontraron cartas con "${activeQuery}". Intenta con otro nombre.`
          }
        />
      ) : activeQuery.trim().length === 0 ? (
        <EmptyState
          icon={PackagePlus}
          title="Escribe para buscar"
          description="Ingresa al menos 3 caracteres para empezar a buscar cartas."
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
                  searchType={searchType}
                  searchQuery={activeQuery}
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
