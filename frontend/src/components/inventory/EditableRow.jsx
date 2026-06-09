import { useState, memo } from 'react'
import { Pencil, Trash2, Check, X, Eye, EyeOff } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { ConfirmDeleteModal } from '../ui/ConfirmDeleteModal'
import { CONDITIONS, RARITIES, EDITIONS, LANGUAGES } from '../../utils/constants'
import { motion } from 'framer-motion'

export const EditableRow = memo(function EditableRow({ card, onEdit, onDelete, actionLoading, mode = 'inventory', folders = [] }) {
  const [editing, setEditing]   = useState(false)
  const [qty, setQty]           = useState(card.quantity)
  const [cond, setCond]         = useState(card.condition || 'new')
  const [folderIds, setFolderIds] = useState(card.folderIds || [])
  const [rarity, setRarity]     = useState(card.rarity || 'Common')
  const [deleting, setDeleting] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  // Nuevos campos de la versión física
  const [setCode, setSetCode]   = useState(card.setCode   || '')
  const [edition, setEdition]   = useState(card.edition   || '')
  const [language, setLanguage] = useState(card.language  || '')

  const handleSave = async () => {
    const numQty = Number(qty)
    const qtyChanged = numQty !== card.quantity
    let changed = false
    let payload = {}

    if (mode === 'inventory') {
      const origCond    = card.condition || 'new'
      const origFolders = card.folderIds || []
      const currentFolders = folderIds || []
      const foldersChanged = origFolders.length !== currentFolders.length || !origFolders.every(f => currentFolders.includes(f))
      const setCodeChanged = setCode !== (card.setCode || '')
      const editionChanged = edition !== (card.edition || '')
      const languageChanged = language !== (card.language || '')
      const rarityChanged  = rarity  !== (card.rarity  || 'Common')
      changed = qtyChanged || cond !== origCond || foldersChanged || setCodeChanged || editionChanged || languageChanged || rarityChanged
      payload = { quantity: numQty, condition: cond, folderIds: currentFolders, rarity, setCode: setCode || undefined, edition: edition || undefined, language: language || undefined }
    } else {
      const origRarity = card.rarity || 'Common'
      changed = qtyChanged || rarity !== origRarity
      payload = { quantity: numQty, rarity }
    }

    if (!changed) {
      setEditing(false)
      return
    }

    const ok = await onEdit(card.id, payload)
    if (ok) setEditing(false)
  }

  const handleCancel = () => {
    setEditing(false)
    setQty(card.quantity)
    setCond(card.condition || 'new')
    setFolderIds(card.folderIds || [])
    setRarity(card.rarity || 'Common')
    setSetCode(card.setCode || '')
    setEdition(card.edition || '')
    setLanguage(card.language || '')
  }

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete(card.id)
    setDeleting(false)
    setShowConfirm(false)
  }

  const handleToggleVisibility = async () => {
    setToggling(true)
    await onEdit(card.id, { isHidden: !card.isHidden })
    setToggling(false)
  }

  return (
    <>
      {/* ── Fila DESKTOP (md+): tabla real con 5 columnas ── */}
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`hidden md:table-row border-b border-white/5 hover:bg-white/[0.02] transition-colors ${card.isHidden ? 'opacity-60 bg-white/[0.02]' : ''}`}
      >
        {/* Carta */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <img
              src={card.image}
              alt={card.name}
              className={`w-10 h-14 object-contain rounded bg-black/20 shrink-0 ${card.isHidden ? 'opacity-40 grayscale' : ''}`}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-white line-clamp-2">
                {card.name}
                {card.isHidden && <EyeOff className="inline w-3 h-3 ml-2 text-slate-400" />}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{card.type}</p>
            </div>
          </div>
        </td>

        {/* Arquetipo */}
        <td className="px-4 py-3 text-xs text-slate-400">
          {card.archetype || <span className="text-slate-600">—</span>}
        </td>

        {/* Set Code + Rareza (datos de la versión física) */}
        <td className="px-4 py-3">
          {editing && mode !== 'inventory' ? (
            <div className="flex flex-col gap-1.5">
              <Select
                options={RARITIES.filter(r => r.value !== 'Any')}
                value={rarity}
                onChange={(e) => setRarity(e.target.value)}
                className="min-w-[130px]"
                hidePlaceholderOption
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {card.setCode && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5 w-fit">
                  {card.setCode}
                </span>
              )}
              {card.rarity && <Badge rarity={card.rarity} />}
              {!card.setCode && !card.rarity && <span className="text-slate-600 text-xs">—</span>}
            </div>
          )}
        </td>

        {/* Cantidad */}
        <td className="px-4 py-3">
          {editing ? (
            <input
              type="number"
              min={0}
              max={999}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-16 bg-[#1f2937] border border-[#374151] rounded-md text-sm text-white
                         text-center px-2 py-1 outline-none focus:border-amber-500/60"
            />
          ) : (
            <span className="text-sm text-slate-200 font-stat">×{card.quantity}</span>
          )}
        </td>

        {/* Condición / Rareza */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {editing ? (
              mode === 'inventory' ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Select
                      options={CONDITIONS}
                      value={cond}
                      onChange={(e) => setCond(e.target.value)}
                      className="min-w-[120px]"
                      hidePlaceholderOption
                    />
                    <Select
                      options={[{ value: '', label: 'Idioma...' }, ...LANGUAGES]}
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="min-w-[100px]"
                      hidePlaceholderOption
                    />
                    {card.edition && (
                      <span className="text-[10px] text-slate-400 bg-white/5 border border-white/10 rounded px-1.5 py-1">
                        {card.edition}
                      </span>
                    )}
                  </div>
                  {folders.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 ml-2 border-l border-white/10 pl-2">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Carpetas:</span>
                      {folders.map(f => {
                        const isSelected = folderIds.includes(f.id)
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setFolderIds(prev => isSelected ? prev.filter(id => id !== f.id) : [...prev, f.id])}
                            className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border transition-colors ${
                              isSelected 
                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' 
                                : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-300'
                            }`}
                          >
                            {f.name}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <Select
                  options={RARITIES}
                  value={rarity}
                  onChange={(e) => setRarity(e.target.value)}
                  className="min-w-[160px]"
                  hidePlaceholderOption
                />
              )
            ) : (
              mode === 'inventory'
                ? (
                  <div className="flex flex-col gap-1">
                    <Badge condition={card.condition} />
                    <div className="flex flex-wrap gap-1">
                      {card.edition  && <span className="text-[10px] text-slate-400 bg-white/5 border border-white/10 rounded px-1.5 py-0.5">{card.edition}</span>}
                      {card.language && <span className="text-[10px] text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded px-1.5 py-0.5">{card.language}</span>}
                    </div>
                  </div>
                )
                : <Badge rarity={card.rarity} />
            )}
          </div>
        </td>

        {/* Acciones */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            {editing ? (
              <>
                <Button variant="success" size="xs" icon={Check} loading={actionLoading} onClick={handleSave} />
                <Button variant="ghost"   size="xs" icon={X}     onClick={handleCancel} />
              </>
            ) : (
              <>
                <Button variant="secondary" size="xs" icon={Pencil} onClick={() => setEditing(true)} />
                {mode === 'wishlist' && (
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={card.isHidden ? Eye : EyeOff}
                    loading={toggling}
                    onClick={handleToggleVisibility}
                    title={card.isHidden ? "Mostrar en wishlist pública" : "Ocultar de wishlist pública"}
                  />
                )}
                <Button variant="danger"    size="xs" icon={Trash2} loading={deleting} onClick={() => setShowConfirm(true)} />
              </>
            )}
          </div>
        </td>
      </motion.tr>

      {/* ── Tarjeta MÓVIL (<md): layout de card ── */}
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`md:hidden border-b border-white/5 ${card.isHidden ? 'opacity-60 bg-white/[0.02]' : ''}`}
      >
        <td colSpan={6} className="p-2.5 max-w-[100vw] sm:max-w-none">
          <div className="flex gap-2.5 w-full">
            {/* Imagen */}
            <img
              src={card.image}
              alt={card.name}
              className={`w-12 h-16 sm:w-14 sm:h-20 object-contain rounded bg-black/20 shrink-0 ${card.isHidden ? 'opacity-40 grayscale' : ''}`}
            />

            {/* Contenido */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
              
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] sm:text-sm font-semibold text-white leading-tight line-clamp-2 break-words pr-1">
                    {card.name}
                    {card.isHidden && <EyeOff className="inline w-3 h-3 ml-1 text-slate-400" />}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 line-clamp-1 break-words">{card.type}</p>
                </div>
                
                {/* Botones de acción simplificados */}
                {!editing && (
                  <div className="flex items-center gap-1 shrink-0">
                    {mode === 'wishlist' && (
                      <button onClick={handleToggleVisibility} disabled={toggling} className="p-1.5 text-slate-400 hover:text-amber-400 bg-white/5 hover:bg-white/10 rounded border border-white/5">
                        {toggling ? <span className="w-3.5 h-3.5 block border-2 border-current border-t-transparent rounded-full animate-spin" /> : card.isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    <button onClick={() => setEditing(true)} className="p-1.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded border border-white/5">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setShowConfirm(true)} disabled={deleting} className="p-1.5 text-slate-400 hover:text-red-400 bg-white/5 hover:bg-white/10 rounded border border-white/5">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {!editing ? (
                /* Estado normal: Compacto */
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-200 bg-black/30 px-1.5 py-0.5 rounded border border-white/10">×{card.quantity}</span>
                  {mode === 'inventory' ? (
                    <>
                      {card.setCode && <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5">{card.setCode}</span>}
                      <Badge condition={card.condition} />
                      {card.rarity && <Badge rarity={card.rarity} />}
                      {card.language && <span className="text-[9px] text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded px-1.5 py-0.5">{card.language}</span>}
                    </>
                  ) : (
                    <Badge rarity={card.rarity} />
                  )}
                </div>
              ) : (
                /* Estado edición: Minimalista */
                <div className="flex flex-col gap-1.5 mt-1 bg-black/20 p-2 rounded-lg border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-medium">Cantidad:</span>
                    <input type="number" min={0} max={999} value={qty} onChange={(e) => setQty(e.target.value)} className="w-12 bg-[#1f2937] border border-[#374151] rounded text-xs text-white text-center px-1 py-0.5 outline-none focus:border-amber-500/50" />
                  </div>
                  
                  {mode === 'inventory' ? (
                    <div className="flex flex-col gap-1.5 w-full">
                      <div className="flex gap-1.5">
                        <Select options={CONDITIONS} value={cond} onChange={(e) => setCond(e.target.value)} className="flex-1" triggerClassName="!text-[10px] !h-6 !py-0 !px-1.5" hidePlaceholderOption />
                        <Select options={[{ value: '', label: 'Idioma' }, ...LANGUAGES]} value={language} onChange={(e) => setLanguage(e.target.value)} className="flex-1" triggerClassName="!text-[10px] !h-6 !py-0 !px-1.5" hidePlaceholderOption />
                      </div>
                      {folders.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {folders.map(f => {
                            const isSelected = folderIds.includes(f.id)
                            return (
                              <button key={f.id} type="button" onClick={() => setFolderIds(prev => isSelected ? prev.filter(id => id !== f.id) : [...prev, f.id])} className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border transition-colors ${isSelected ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-black/20 border-white/5 text-slate-500 hover:text-slate-300'}`}>
                                {f.name}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Select options={RARITIES} value={rarity} onChange={(e) => setRarity(e.target.value)} className="w-full" triggerClassName="!text-[10px] !h-6 !py-0 !px-1.5" hidePlaceholderOption />
                  )}
                  
                  <div className="flex justify-end gap-1.5 mt-1">
                    <Button variant="ghost" size="xs" icon={X} onClick={handleCancel} className="!text-[10px] !h-6 !py-0 !px-2">Cancelar</Button>
                    <Button variant="success" size="xs" icon={Check} loading={actionLoading} onClick={handleSave} className="!text-[10px] !h-6 !py-0 !px-2">Guardar</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </td>
      </motion.tr>

      <ConfirmDeleteModal
        open={showConfirm}
        cardName={card.name}
        cardImage={card.image}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  )
})
