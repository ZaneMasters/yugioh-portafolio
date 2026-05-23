import { useState, useCallback } from 'react'
import { folderService } from '../services/folderService'
import toast from 'react-hot-toast'

export function useFolders() {
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchFolders = useCallback(async () => {
    setLoading(true)
    try {
      const data = await folderService.getFolders()
      setFolders(data || [])
    } catch (err) {
      toast.error('Error al cargar carpetas.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createFolder = async (folderData) => {
    setActionLoading(true)
    try {
      const newFolder = await folderService.createFolder(folderData)
      setFolders(prev => [newFolder, ...prev])
      toast.success('Carpeta creada exitosamente.')
      return newFolder
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al crear carpeta.')
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  const updateFolder = async (id, folderData) => {
    setActionLoading(true)
    try {
      const updated = await folderService.updateFolder(id, folderData)
      setFolders(prev => prev.map(f => f.id === id ? updated : f))
      toast.success('Carpeta actualizada.')
      return updated
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al actualizar carpeta.')
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  const deleteFolder = async (id) => {
    setActionLoading(true)
    try {
      await folderService.deleteFolder(id)
      setFolders(prev => prev.filter(f => f.id !== id))
      toast.success('Carpeta eliminada.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar carpeta.')
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  return {
    folders,
    loading,
    actionLoading,
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
  }
}
