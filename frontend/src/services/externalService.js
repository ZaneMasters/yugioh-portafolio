import publicApi from './publicApi'

/** Buscar cartas en catálogo externo por nombre, código de set o arquetipo */
export const searchExternalCards = (name, type = 'name', lang = 'en', signal = undefined) =>
  publicApi.get('/external/cards', { params: { name, type, lang }, signal })

/** Obtener carta de catálogo externo por ID numérico */
export const getExternalCardById = (id, lang = 'en') => 
  publicApi.get(`/external/cards/${id}`, { params: { lang } })

/** Obtener el estado del catálogo en memoria */
export const getCatalogStatus = () => 
  publicApi.get('/external/catalog-status')
