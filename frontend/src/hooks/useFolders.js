import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { folderService } from '../services/folderService'
import { queryKeys } from '../lib/queryKeys'

/**
 * Hook para CRUD de colecciones (folders) del usuario autenticado.
 */
export function useFolders() {
  const queryClient = useQueryClient()

  // ── Query ──────────────────────────────────────────────────────────────────
  const { data: folders = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.folders(),
    queryFn: () => folderService.getFolders(),
    select: (res) => res.data ?? res ?? [],
  })

  // ── Mutaciones ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (folderData) => folderService.createFolder(folderData),
    onSuccess: (res) => {
      const newFolder = res.data ?? res
      // Actualización optimista: insertar al inicio sin re-fetch
      queryClient.setQueryData(queryKeys.folders(), (old = []) => [newFolder, ...old])
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
      queryClient.invalidateQueries({ queryKey: ['publicFolders'] })
      toast.success('Carpeta creada exitosamente.')
    },
    onError: (err) => toast.error(err.message || 'Error al crear carpeta.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, folderData }) => folderService.updateFolder(id, folderData),
    onSuccess: (res, { id }) => {
      const updated = res.data ?? res
      queryClient.setQueryData(queryKeys.folders(), (old = []) =>
        old.map((f) => (f.id === id ? updated : f))
      )
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
      queryClient.invalidateQueries({ queryKey: ['publicFolders'] })
      toast.success('Carpeta actualizada.')
    },
    onError: (err) => toast.error(err.message || 'Error al actualizar carpeta.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => folderService.deleteFolder(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(queryKeys.folders(), (old = []) =>
        old.filter((f) => f.id !== id)
      )
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
      queryClient.invalidateQueries({ queryKey: ['publicFolders'] })
      toast.success('Carpeta eliminada.')
    },
    onError: (err) => toast.error(err.message || 'Error al eliminar carpeta.'),
  })

  return {
    folders,
    loading,
    actionLoading: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    createFolder: (folderData)         => createMutation.mutateAsync(folderData),
    updateFolder: (id, folderData)     => updateMutation.mutateAsync({ id, folderData }),
    deleteFolder: (id)                 => deleteMutation.mutateAsync(id),
    // Compatibilidad: permite forzar refetch desde el exterior si es necesario
    fetchFolders: () => queryClient.invalidateQueries({ queryKey: queryKeys.folders() }),
  }
}
