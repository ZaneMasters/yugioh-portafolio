import { useState, memo, useMemo, useEffect } from 'react'
import { Plus, Sword, Shield, Minus, ChevronDown, Tag, Palette, Check } from 'lucide-react'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { RARITIES, EDITIONS, LANGUAGES } from '../../utils/constants'
import { useInventoryLookup } from '../../hooks/useInventoryLookup'

// Normaliza igual que el backend (elimina todo lo que no sea letras/números)
const normalizeStr = (str) => (!str ? '' : str.toLowerCase().replace(/[^a-z0-9]/g, ''))

/**
 * Dado un query de búsqueda por set (ej: "MP24", "Maximum Gold", "LOB-EN005"),
 * devuelve el PRIMER set de la carta que coincide con el query normalizado.
 */
function findMatchingSet(cardSets, query) {
  if (!cardSets?.length || !query) return null
  const nq = normalizeStr(query)
  return cardSets.find(s => {
    const codeNorm   = normalizeStr(s.setCode)
    const prefixNorm = normalizeStr(s.setCode?.split('-')[0] ?? '')
    const nameNorm   = normalizeStr(s.setName)
    return codeNorm.includes(nq) || prefixNorm === nq || nameNorm.includes(nq)
  }) ?? null
}

export const CardSearchResult = memo(function CardSearchResult({
  card,
  destination = 'inventory',
  onAdd,
  adding,
  folders = [],
  searchType = 'name',
  searchQuery = '',
}) {
  const [qty,      setQty]      = useState(1)
  const [rarity,   setRarity]   = useState('Any')
  const [folderId, setFolderId] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  // Campos de la versión física
  const [selectedSet,     setSelectedSet]     = useState(null)
  const [selectedImageId, setSelectedImageId] = useState(card.cardImages?.[0]?.id ?? null)
  const [edition,         setEdition]         = useState('')
  const [language,        setLanguage]        = useState('')

  // Consulta de inventario del usuario para indicar posesión de la carta / set
  const { getSetInventory, getCardInventory } = useInventoryLookup()
  const cardOwnership = getCardInventory(card.cardId, card.name)

  // ── Auto-seleccionar set cuando la búsqueda coincide o cuando el usuario ya tiene este set ──
  useEffect(() => {
    if (!card.cardSets?.length) return

    // 1. Si la query de búsqueda coincide con algún set (ej: MP16-EN057, LOB-001 o AMDE-EN046)
    if (searchQuery) {
      const match = findMatchingSet(card.cardSets, searchQuery)
      if (match) {
        setSelectedSet(match)
        setRarity(match.rarity || 'Common')
        return
      }
    }

    // 2. Si el usuario ya posee esta carta en su inventario con algún set, auto-seleccionar ese set por defecto
    if (cardOwnership?.sets?.size > 0 && !selectedSet) {
      const ownedMatch = card.cardSets.find(s => s.setCode && cardOwnership.sets.has(s.setCode.trim().toUpperCase()))
      if (ownedMatch) {
        setSelectedSet(ownedMatch)
        setRarity(ownedMatch.rarity || 'Common')
      }
    }
  }, [searchType, searchQuery, card.cardSets, cardOwnership])

  // Rarezas disponibles para el setCode seleccionado actualmente (ej: AMDE-EN046 tiene Rare y Collector's Rare)
  const availableRaritiesForSet = useMemo(() => {
    if (!selectedSet?.setCode || !card.cardSets?.length) return []
    const codeNorm = normalizeStr(selectedSet.setCode)
    const matches = card.cardSets.filter(s => normalizeStr(s.setCode) === codeNorm)
    const seen = new Set()
    const rarities = []
    for (const s of matches) {
      if (s.rarity && !seen.has(s.rarity)) {
        seen.add(s.rarity)
        rarities.push(s.rarity)
      }
    }
    return rarities
  }, [selectedSet?.setCode, card.cardSets])

  const handleRarityChange = (newRarity) => {
    setRarity(newRarity)
    if (!selectedSet?.setCode) return
    const codeNorm = normalizeStr(selectedSet.setCode)
    const match = card.cardSets.find(
      s => normalizeStr(s.setCode) === codeNorm && s.rarity === newRarity
    )
    if (match) {
      setSelectedSet(match)
    } else {
      setSelectedSet(prev => prev ? { ...prev, rarity: newRarity } : null)
    }
  }

  const setOwnership = selectedSet?.setCode
    ? getSetInventory(selectedSet.setCode, selectedSet.rarity || rarity)
    : null

  // Imagen actualmente mostrada (preview del arte seleccionado)
  const previewImage = useMemo(() => {
    if (!selectedImageId) return card.imageSmall || card.image
    const found = card.cardImages?.find(i => i.id === selectedImageId)
    return found?.imageSmall ?? card.imageSmall ?? card.image
  }, [selectedImageId, card])

  // Cuando el usuario elige un set manualmente
  const handleSetChange = (e) => {
    const val = e.target.value
    if (!val) {
      setSelectedSet(null)
      setRarity('Common')
      return
    }
    const found = card.cardSets.find((s) => s.setCode === val)
    if (found) {
      setSelectedSet(found)
      setRarity(found.rarity)
      setEdition('') // Al elegir set, reseteamos la edición manual
    }
  }

  function handleAdd() {
    if (destination === 'inventory') {
      const payload = {
        setCode:         selectedSet?.setCode   ?? undefined,
        setName:         selectedSet?.setName   ?? undefined,
        rarity:          selectedSet?.rarity    ?? (rarity !== 'Any' ? rarity : undefined),
        selectedImageId: selectedImageId        ?? undefined,
        edition:         edition || undefined,
        language:        language || undefined,
      }
      onAdd(card, qty, folderId, payload)
    } else {
      onAdd(card, qty, selectedSet?.rarity ?? rarity)
    }
  }

  const hasMultipleArts = (card.cardImages?.length ?? 0) > 1
  const hasSets         = (card.cardSets?.length ?? 0) > 0

  return (
    <div className={`rounded-xl border transition-all overflow-hidden ${
      setOwnership
        ? 'bg-[#0e2722]/85 border-emerald-500/50 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/30'
        : cardOwnership
          ? 'bg-[#15233c]/85 border-sky-500/35 ring-1 ring-sky-500/20'
          : 'bg-[#1a2235] border-white/5 group hover:border-amber-500/20'
    }`}>

      {/* ── Fila principal (siempre visible) ── */}
      <div className="flex items-center gap-2.5 p-2.5">
        {/* Imagen */}
        <div className="relative shrink-0 w-10 h-14 sm:w-14 sm:h-20 rounded-md overflow-hidden bg-black/30">
          <img
            src={previewImage}
            alt={card.name}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            className={`w-full h-full object-contain transition-all duration-300 ${
              imgLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'
            }`}
            onError={(e) => { e.target.onerror = null; e.target.src = '/card-placeholder.png'; setImgLoaded(true); }}
          />
          {!imgLoaded && (
            <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center">
              <div className="w-4 h-6 sm:w-6 sm:h-8 bg-white/10 rounded-sm" />
            </div>
          )}
          {hasMultipleArts && destination === 'inventory' && (
            <div className="absolute bottom-0 right-0 bg-black/70 text-[9px] text-amber-400 font-bold px-1 py-0.5 rounded-tl">
              <Palette className="w-2.5 h-2.5" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-white leading-tight line-clamp-2 group-hover:text-amber-400 transition-colors">
              {card.name}
            </p>
            {setOwnership ? (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-500/50 text-emerald-300 text-xs font-bold shrink-0 shadow-sm"
                title={`Tienes ${setOwnership.quantity} copia(s) con este código exacto (${selectedSet.setCode})`}
              >
                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                En inventario (×{setOwnership.quantity})
              </span>
            ) : cardOwnership ? (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-200 text-xs font-semibold shrink-0 shadow-sm"
                title={`Tienes ${cardOwnership.quantity} copia(s) de esta carta en tu inventario`}
              >
                <Check className="w-3.5 h-3.5 text-sky-400 stroke-[2.5]" />
                En inventario (×{cardOwnership.quantity}){cardOwnership.sets?.size > 0 ? ` • ${Array.from(cardOwnership.sets).join(', ')}` : ''}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{card.type}</p>
          {(card.atk !== null || card.def !== null) && (
            <div className="hidden sm:flex gap-2 text-xs font-stat mt-0.5">
              {card.atk !== null && (
                <span className="flex items-center gap-0.5 text-red-400">
                  <Sword className="w-3 h-3" />{card.atk}
                </span>
              )}
              {card.def !== null && (
                <span className="flex items-center gap-0.5 text-sky-400">
                  <Shield className="w-3 h-3" />{card.def}
                </span>
              )}
            </div>
          )}

          {/* Badges de set auto-seleccionado (visibles sin abrir el panel) */}
          {selectedSet && (
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono">
                {selectedSet.setCode}
              </span>

              {/* Selector interactivo de rarezas si la búsqueda es por set y hay múltiples rarezas para este código */}
              {searchType === 'set' && availableRaritiesForSet.length > 1 ? (
                <div className="flex flex-wrap items-center gap-1 bg-purple-500/10 border border-purple-500/25 px-1.5 py-0.5 rounded-lg">
                  <span className="text-[10px] font-semibold text-purple-300/80 mr-0.5">Rareza:</span>
                  {availableRaritiesForSet.length <= 3 ? (
                    availableRaritiesForSet.map((r) => {
                      const isSelected = (selectedSet.rarity || rarity) === r
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRarityChange(r)
                          }}
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-300'
                              : 'bg-white/5 hover:bg-white/10 text-purple-200 border border-white/10'
                          }`}
                        >
                          {r}
                        </button>
                      )
                    })
                  ) : (
                    <div className="relative inline-flex items-center">
                      <select
                        value={selectedSet.rarity || rarity}
                        onChange={(e) => handleRarityChange(e.target.value)}
                        className="text-[10px] font-bold rounded bg-purple-500/20 border border-purple-500/40 text-purple-200 pl-1.5 pr-5 py-0.5 outline-none hover:border-purple-400 focus:ring-1 focus:ring-purple-400 cursor-pointer appearance-none"
                      >
                        {availableRaritiesForSet.map((r) => (
                          <option key={r} value={r} className="bg-[#1a2235] text-white">
                            {r}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 text-purple-300 absolute right-1 pointer-events-none" />
                    </div>
                  )}
                </div>
              ) : (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-purple-500/10 border border-purple-500/20 text-purple-300">
                  {selectedSet.rarity}
                </span>
              )}

              {setOwnership ? (
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                  ✓ Ya tienes {setOwnership.quantity} copia{setOwnership.quantity > 1 ? 's' : ''} de esta versión ({selectedSet.rarity})
                </span>
              ) : cardOwnership ? (
                <span className="text-[11px] font-medium text-sky-300 flex items-center gap-1">
                  ℹ Tienes otra versión en inventario ({Array.from(cardOwnership.sets).join(', ')})
                </span>
              ) : null}
            </div>
          )}
        </div>

        {/* Controles compactos */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
          {/* Idioma (Compacto) */}
          <div className="w-[68px] sm:w-24 shrink-0">
            <Select
              options={LANGUAGES.map(l => ({ value: l.value, label: l.value, title: l.label }))}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="Idioma"
              hidePlaceholderOption={false}
              title="Idioma de la carta"
              triggerClassName="!py-0.5 !px-1.5 sm:!px-2 !h-6 sm:!h-7 !text-[10px] sm:!text-[11px] bg-[#1f2937] border-[#374151] hover:border-amber-500/50 rounded-md shadow-sm"
            />
          </div>

          {/* Fila inferior en mobile: Cantidad + Opciones + Agregar */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Cantidad */}
            <div className="flex items-center gap-0.5 bg-black/30 rounded border border-white/10 p-0.5 h-6 sm:h-7">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-slate-400 hover:text-white transition-colors rounded"
              >
                <Minus className="w-2.5 h-2.5" />
              </button>
              <span className="w-4 sm:w-5 text-center text-xs font-stat text-white select-none">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(99, q + 1))}
                className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-slate-400 hover:text-white transition-colors rounded"
              >
                <Plus className="w-2.5 h-2.5" />
              </button>
            </div>

            {/* Expandir opciones — mobile */}
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className={`sm:hidden w-6 h-6 flex items-center justify-center rounded border transition-all ${
                expanded ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-black/30 border-white/10 text-slate-400 hover:text-slate-300'
              }`}
              title="Opciones"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>

            {/* Botón agregar */}
            <Button
              variant="primary"
              size="sm"
              loading={adding}
              onClick={handleAdd}
              className="shrink-0 w-6 h-6 !p-0 sm:!px-3 sm:w-auto sm:h-auto sm:text-sm flex items-center justify-center rounded"
            >
              <Plus className="w-5 h-5 shrink-0 sm:hidden" />
              <Plus className="w-4 h-4 shrink-0 hidden sm:block" />
              <span className="hidden sm:inline">Agregar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Panel de opciones ── */}
      <div className={`px-2.5 pb-2.5 border-t border-white/5 pt-2 flex flex-col gap-2
        sm:flex
        ${expanded ? 'flex' : 'hidden sm:flex'}
      `}>
        {destination === 'inventory' ? (
          <>
            {/* Carpeta */}
            {folders.length > 0 && (
              <div>
                <Select
                  options={[{ value: '', label: 'Carpeta: Ninguna' }, ...folders.map(f => ({ value: f.id, label: `Carpeta: ${f.name}` }))]}
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  placeholder="Carpeta"
                  hidePlaceholderOption={true}
                  title="Carpeta destino (opcional)"
                />
              </div>
            )}

            {/* Fila 2: Expansión — read-only si vino de búsqueda por set, editable si no */}
            {hasSets && (
              <div className="w-full">
                <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  <Tag className="w-2.5 h-2.5" /> Expansión / Set Code
                </label>

                {searchType === 'set' ? (
                  /* ── Solo lectura: la expansión viene fijada por la búsqueda, pero permite elegir rareza si hay varias ── */
                  <div className="flex flex-wrap items-center gap-1.5">
                    {selectedSet ? (
                      <>
                        <span className="px-2 py-1 text-[10px] font-bold rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono">
                          {selectedSet.setCode}
                        </span>

                        {availableRaritiesForSet.length > 1 ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-purple-300">Seleccionar Rareza:</span>
                            {availableRaritiesForSet.map((r) => {
                              const isSelected = (selectedSet.rarity || rarity) === r
                              return (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => handleRarityChange(r)}
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                                    isSelected
                                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30 ring-1 ring-purple-300'
                                      : 'bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 border border-purple-500/30'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                  <span>{r}</span>
                                </button>
                              )
                            })}
                          </div>
                        ) : (
                          <span className="px-2 py-1 text-[10px] font-semibold rounded bg-purple-500/10 border border-purple-500/20 text-purple-300">
                            {selectedSet.rarity}
                          </span>
                        )}

                        {setOwnership && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                            <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                            Ya tienes {setOwnership.quantity} copia{setOwnership.quantity > 1 ? 's' : ''} en inventario ({selectedSet.rarity})
                          </span>
                        )}
                        {(selectedSet.setPrice && selectedSet.setPrice !== '0.00' && selectedSet.setPrice !== '0') && (
                          <span className="px-2 py-1 text-[10px] font-bold rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            ${selectedSet.setPrice} USD
                          </span>
                        )}
                        {selectedSet.setName && (
                          <span className="px-2 py-1 text-[10px] rounded bg-white/5 border border-white/10 text-slate-400">
                            {selectedSet.setName}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-slate-600 italic">Sin set coincidente</span>
                    )}
                  </div>
                ) : (
                  /* ── Selector completo cuando la búsqueda es por nombre/arquetipo ── */
                  <>
                    <select
                      value={selectedSet?.setCode ?? ''}
                      onChange={handleSetChange}
                      className="w-full bg-black/30 border border-white/10 rounded-lg text-xs text-slate-200
                                 px-2.5 py-2 outline-none focus:border-amber-500/40 focus:bg-black/50
                                 transition-all appearance-none cursor-pointer"
                      title="Selecciona la expansión de tu carta física"
                    >
                      <option value="">— Sin especificar —</option>
                      {card.cardSets?.map((s, i) => {
                        const hasSetPrice = s.setPrice && s.setPrice !== '0.00' && s.setPrice !== '0';
                        const setInv = getSetInventory(s.setCode);
                        return (
                          <option key={`${s.setCode}-${i}`} value={s.setCode}>
                            {s.setCode} | {s.rarity}
                            {hasSetPrice ? ` | $${s.setPrice}` : ''}
                            {setInv ? ` [✓ TIENES ×${setInv.quantity} EN INVENTARIO]` : ''}
                            {' '}— {s.setName}
                          </option>
                        );
                      })}
                    </select>
                    {selectedSet && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
                          {selectedSet.setCode}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-purple-500/10 border border-purple-500/20 text-purple-300">
                          {selectedSet.rarity}
                        </span>
                        {setOwnership && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                            <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                            Ya tienes {setOwnership.quantity} copia{setOwnership.quantity > 1 ? 's' : ''}
                          </span>
                        )}
                        {(selectedSet.setPrice && selectedSet.setPrice !== '0.00' && selectedSet.setPrice !== '0') && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            ${selectedSet.setPrice} USD
                          </span>
                        )}
                        {selectedSet.setName && (
                          <span className="px-2 py-0.5 text-[10px] rounded bg-white/5 border border-white/10 text-slate-400">
                            {selectedSet.setName}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Fila 3 eliminada: Edición */}

            {/* Fila 4: Selector de Arte Alternativo */}
            {hasMultipleArts && searchType !== 'set' && (
              <div>
                <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  <Palette className="w-2.5 h-2.5" /> Arte ({card.cardImages.length} disponibles)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {card.cardImages.map((img, idx) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setSelectedImageId(img.id)}
                      title={`Arte alternativo ${idx + 1}`}
                      className={`relative w-10 h-14 rounded-md overflow-hidden border-2 transition-all ${
                        selectedImageId === img.id
                          ? 'border-amber-500 shadow-lg shadow-amber-500/30 scale-105'
                          : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img.imageSmall}
                        alt={`Arte ${idx + 1}`}
                        className="w-full h-full object-contain"
                        onError={(e) => { e.target.onerror = null; e.target.src = '/card-placeholder.png' }}
                      />
                      {selectedImageId === img.id && (
                        <div className="absolute inset-0 bg-amber-500/10" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 min-w-[100px]">
            <Select
              options={RARITIES}
              value={rarity}
              onChange={(e) => setRarity(e.target.value)}
              placeholder="Rareza deseada"
              hidePlaceholderOption={true}
              title="Selecciona en qué rareza estás buscando esta carta"
            />
          </div>
        )}
      </div>
    </div>
  )
})
