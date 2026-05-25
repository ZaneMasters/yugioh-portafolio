import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Globe, Lock, Loader2, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '../ui/Button'
import { ConfirmDeleteModal } from '../ui/ConfirmDeleteModal'

export function FoldersPanel({ folders = [], loading, actionLoading, createFolder, updateFolder, deleteFolder, onFolderClick }) {
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editPublic, setEditPublic] = useState(true)
  
  const [isAdding, setIsAdding] = useState(false)
  const [addName, setAddName] = useState('')
  const [addPublic, setAddPublic] = useState(true)

  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  const handleCreate = async () => {
    const trimmedName = addName.trim()
    if (!trimmedName) return

    const exists = folders.some(f => f.name.toLowerCase() === trimmedName.toLowerCase())
    if (exists) {
      toast.error('Ya existe una colección con ese nombre.')
      return
    }

    await createFolder({ name: trimmedName, isPublic: addPublic })
    setIsAdding(false)
    setAddName('')
    setAddPublic(true)
  }

  const handleUpdate = async (id) => {
    const trimmedName = editName.trim()
    if (!trimmedName) return

    const exists = folders.some(f => f.id !== id && f.name.toLowerCase() === trimmedName.toLowerCase())
    if (exists) {
      toast.error('Ya existe otra colección con ese nombre.')
      return
    }

    await updateFolder(id, { name: trimmedName, isPublic: editPublic })
    setEditingId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Tus Colecciones</h2>
        <Button variant="primary" icon={Plus} size="sm" onClick={() => setIsAdding(true)}>
          Nueva Colección
        </Button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl glass border border-amber-500/30 overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Nombre de la colección..."
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                autoFocus
                className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500/50"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setAddPublic(!addPublic)}
                className={`px-3 py-2 rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  addPublic ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {addPublic ? <Globe size={16} /> : <Lock size={16} />}
                <span className="text-sm font-medium">{addPublic ? 'Pública' : 'Privada'}</span>
              </motion.button>
              <div className="flex gap-2">
                <Button variant="success" onClick={handleCreate} loading={actionLoading} icon={Check}>Guardar</Button>
                <Button variant="ghost" onClick={() => setIsAdding(false)} icon={X}>Cancelar</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-amber-400" /></div>
        ) : folders.length === 0 && !isAdding ? (
          <div className="col-span-full py-10 text-center text-slate-500">
            No tienes ninguna colección creada todavía.
          </div>
        ) : (
          folders.map((f) => (
            <motion.div
              key={f.id}
              layout
              className={`p-4 rounded-xl glass border border-white/5 flex flex-col gap-3 transition-colors ${
                !editingId && onFolderClick ? 'cursor-pointer hover:border-amber-500/30 group' : ''
              }`}
              onClick={() => {
                if (!editingId && onFolderClick) onFolderClick(f.id)
              }}
            >
              {editingId === f.id ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-white outline-none focus:border-amber-500/50"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setEditPublic(!editPublic)}
                      className={`px-2 py-1 rounded text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                        editPublic ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20' : 'text-slate-400 bg-slate-800 hover:bg-slate-700'
                      }`}
                    >
                      {editPublic ? <Globe size={12} /> : <Lock size={12} />}
                      {editPublic ? 'Pública' : 'Privada'}
                    </motion.button>
                    <div className="flex gap-1.5">
                      <Button variant="success" size="xs" onClick={() => handleUpdate(f.id)} loading={actionLoading} icon={Check} />
                      <Button variant="ghost" size="xs" onClick={() => setEditingId(null)} icon={X} />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-white break-words pr-2 group-hover:text-amber-400 transition-colors">{f.name}</h3>
                    <div title={f.isPublic ? 'Pública' : 'Privada'}>
                      {f.isPublic ? <Globe className="text-emerald-400/80 w-4 h-4 mt-1" /> : <Lock className="text-slate-500 w-4 h-4 mt-1" />}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-auto pt-3 border-t border-white/5">
                    <Button variant="secondary" size="xs" icon={Pencil} onClick={(e) => {
                      e.stopPropagation()
                      setEditingId(f.id)
                      setEditName(f.name)
                      setEditPublic(f.isPublic)
                    }}>Editar</Button>
                    <Button variant="danger" size="xs" icon={Trash2} onClick={(e) => {
                      e.stopPropagation()
                      setDeleteConfirmId(f.id)
                    }}>Eliminar</Button>
                  </div>
                </>
              )}
            </motion.div>
          ))
        )}
      </div>

      <ConfirmDeleteModal
        open={!!deleteConfirmId}
        cardName={folders.find(f => f.id === deleteConfirmId)?.name}
        loading={actionLoading}
        onConfirm={async () => {
          await deleteFolder(deleteConfirmId)
          setDeleteConfirmId(null)
        }}
        onCancel={() => setDeleteConfirmId(null)}
        title="¿Eliminar Colección?"
        description="Las cartas en esta colección no se eliminarán, pero perderán su asignación a la colección. Esta acción no se puede deshacer."
      />
    </div>
  )
}
