import api from './api'

/** Buscar cartas en YGOProdeck por nombre parcial */
export const searchExternalCards = (name, lang = 'en', signal = undefined) =>
  api.get('/external/cards', { params: { name, lang }, signal })

/** Obtener carta de YGOProdeck por ID numérico */
export const getExternalCardById = (id, lang = 'en') => 
  api.get(`/external/cards/${id}`, { params: { lang } })
