/**
 * Cache en memoria + sessionStorage para resultados de búsqueda del frontend.
 *
 * Dos niveles:
 *  1. Memoria (Map) — instantáneo, vive mientras la pestaña esté abierta
 *  2. sessionStorage — persiste entre navegaciones dentro de la misma sesión
 *
 * TTL configurable por tipo de consulta.
 */

const SEARCH_TTL_MS = 5 * 60 * 1000   // 5 min — búsquedas por nombre
const CARD_TTL_MS   = 60 * 60 * 1000  // 1 hora — cartas individuales

// Nivel 1: Map en memoria (más rápido que sessionStorage)
const memoryMap = new Map()

// ── Helpers ────────────────────────────────────────────────────────────────────

function isExpired(entry) {
  return Date.now() > entry.expiresAt
}

/** Guarda en memoria y en sessionStorage */
function save(key, data, ttlMs) {
  const entry = { data, expiresAt: Date.now() + ttlMs }
  memoryMap.set(key, entry)
  try {
    sessionStorage.setItem(`ygo_cache:${key}`, JSON.stringify(entry))
  } catch {
    // sessionStorage lleno o no disponible — solo memoria
  }
}

/** Lee desde memoria primero, luego sessionStorage */
function read(key) {
  // Nivel 1: memoria
  const memEntry = memoryMap.get(key)
  if (memEntry) {
    if (!isExpired(memEntry)) return memEntry.data
    memoryMap.delete(key)
  }

  // Nivel 2: sessionStorage
  try {
    const raw = sessionStorage.getItem(`ygo_cache:${key}`)
    if (!raw) return null
    const entry = JSON.parse(raw)
    if (!isExpired(entry)) {
      memoryMap.set(key, entry) // promover a memoria
      return entry.data
    }
    sessionStorage.removeItem(`ygo_cache:${key}`)
  } catch {
    // parse error o storage no disponible
  }
  return null
}

/** Elimina una clave de ambos niveles */
function remove(key) {
  memoryMap.delete(key)
  try { sessionStorage.removeItem(`ygo_cache:${key}`) } catch { /* noop */ }
}

/** Limpia todas las entradas de la cache del frontend */
export function clearSearchCache() {
  memoryMap.clear()
  try {
    Object.keys(sessionStorage)
      .filter(k => k.startsWith('ygo_cache:'))
      .forEach(k => sessionStorage.removeItem(k))
  } catch { /* noop */ }
}

// ── API pública ────────────────────────────────────────────────────────────────

/**
 * Retorna el resultado cacheado para una búsqueda por nombre, o null si no existe.
 * @param {string} name
 * @param {string} lang
 */
export function getCachedSearch(name, lang = 'en') {
  return read(`search:${name.trim().toLowerCase()}:lang:${lang}`)
}

/**
 * Guarda los resultados de una búsqueda por nombre.
 * @param {string} name
 * @param {Array} results
 * @param {string} lang
 */
export function setCachedSearch(name, results, lang = 'en') {
  save(`search:${name.trim().toLowerCase()}:lang:${lang}`, results, SEARCH_TTL_MS)
}

/**
 * Retorna la carta cacheada por cardId, o null si no existe.
 * @param {number|string} cardId
 */
export function getCachedCard(cardId) {
  return read(`card:${cardId}`)
}

/**
 * Guarda una carta individual en cache.
 * @param {number|string} cardId
 * @param {Object} card
 */
export function setCachedCard(cardId, card) {
  save(`card:${cardId}`, card, CARD_TTL_MS)
}
