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

/** Obtener la banlist oficial directamente desde YGOProdeck API */
export const getBanlist = async (format = 'tcg', signal = undefined) => {
  const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?banlist=${format}`, { signal })
  if (!res.ok) {
    throw new Error(`Error al consultar banlist de YGOProdeck (${res.status})`)
  }
  return res.json()
}

/** Obtener todas las cartas permitidas/legales de un formato específico (ej: 'goat', 'edison') */
export const getFormatCards = async (format = 'goat', signal = undefined) => {
  const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?format=${encodeURIComponent(format)}`, { signal })
  if (!res.ok) {
    throw new Error(`Error al consultar cartas del formato ${format} (${res.status})`)
  }
  return res.json()
}
