import api from './api'
import publicApi from './publicApi'

export const folderService = {
  // Admin (requiere auth)
  getFolders: async () => {
    const res = await api.get('/folders')
    return res.data
  },

  createFolder: async (folderData) => {
    const res = await api.post('/folders', folderData)
    return res.data
  },

  updateFolder: async (id, folderData) => {
    const res = await api.put(`/folders/${id}`, folderData)
    return res.data
  },

  deleteFolder: async (id) => {
    return api.delete(`/folders/${id}`)
  },

  // Public
  getPublicFolders: async (slug) => {
    const res = await publicApi.get(`/folders/portfolio/${slug}`)
    return res.data
  }
}
