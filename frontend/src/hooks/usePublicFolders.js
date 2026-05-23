import { useState, useCallback } from 'react'
import { folderService } from '../services/folderService'

export function usePublicFolders(slug) {
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchPublicFolders = useCallback(async () => {
    if (!slug) return
    setLoading(true)
    try {
      const data = await folderService.getPublicFolders(slug)
      setFolders(data || [])
    } catch (err) {
      console.error('Error fetching public folders:', err)
    } finally {
      setLoading(false)
    }
  }, [slug])

  return {
    folders,
    loading,
    fetchPublicFolders,
  }
}
