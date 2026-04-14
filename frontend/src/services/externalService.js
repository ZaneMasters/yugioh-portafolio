import api from './api'

/** Buscar cartas en YGOProdeck por nombre parcial */
export const searchExternalCards = (name) =>
  api.get('/external/cards', { params: { name } })

/** Obtener carta de YGOProdeck por ID numérico */
export const getExternalCardById = (id) => api.get(`/external/cards/${id}`)
