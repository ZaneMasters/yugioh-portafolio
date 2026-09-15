'use strict';

const axios = require('axios');
const logger = require('../utils/logger');

const TCG_SEARCH_URL = 'https://mp-search-api.tcgplayer.com/v1/search/request';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos de caché en memoria para búsquedas
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

// Caché en memoria para evitar repetir búsquedas de la misma carta
const searchCache = new Map();

/**
 * Normaliza cadenas para comparaciones flexibles (elimina espacios y caracteres no alfanuméricos)
 */
const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const tcgAxios = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'application/json',
  },
});

/**
 * Realiza una búsqueda de productos en TCGPlayer por nombre de carta.
 * @param {string} cardName
 * @returns {Promise<Array>} Lista de variantes de la carta
 */
async function searchTCGPlayer(cardName) {
  if (!cardName || typeof cardName !== 'string') return [];

  const cleanName = cardName.trim();
  const cacheKey = cleanName.toLowerCase();

  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.items;
  }

  try {
    const payload = {
      algorithm: '',
      fromPath: 'search',
      size: 50,
      context: { cart: {} },
      settings: { useTCGStandardSizes: true },
      sort: {},
      filters: { term: {} },
    };

    const url = `${TCG_SEARCH_URL}?q=${encodeURIComponent(cleanName)}&isList=false`;
    const response = await tcgAxios.post(url, payload);

    const items = response.data?.results?.[0]?.results || [];

    // Guardar en caché en memoria
    searchCache.set(cacheKey, {
      items,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    // Limpieza periódica de caché para evitar crecimiento ilimitado
    if (searchCache.size > 500) {
      const now = Date.now();
      for (const [k, v] of searchCache.entries()) {
        if (now > v.expiresAt) searchCache.delete(k);
      }
    }

    return items;
  } catch (err) {
    logger.warn(`⚠️  Error al consultar TCGPlayer para "${cardName}": ${err.message}`);
    return [];
  }
}

/**
 * Obtiene el precio de mercado y precio más bajo de una carta específica en TCGPlayer.
 * Realiza matching exacto por setCode (número de carta), y si no, por rareza/nombre de set.
 *
 * @param {string} cardName - Nombre de la carta (ej: "Nibiru, the Primal Being")
 * @param {string|null} setCode - Código de la expansión (ej: "TN19-EN013" o "RA01-EN001")
 * @param {string|null} rarity - Rareza opcional (ej: "Ultra Rare")
 * @param {string|null} setName - Nombre de la expansión opcional
 * @returns {Promise<{ marketPrice: number|null, lowPrice: number|null, matchedNumber: string|null }>}
 */
async function getPriceForCard(cardName, setCode = null, rarity = null, setName = null) {
  const items = await searchTCGPlayer(cardName);
  if (!items || items.length === 0) {
    return { marketPrice: null, lowPrice: null, matchedNumber: null };
  }

  const targetCodeNorm = normalize(setCode);
  const targetRarityNorm = normalize(rarity);
  const targetSetNameNorm = normalize(setName);

  let match = null;

  // 1. Coincidencia exacta por código de set / número (ej: "TN19-EN013")
  if (targetCodeNorm) {
    match = items.find(i => normalize(i.customAttributes?.number) === targetCodeNorm);
  }

  // 2. Coincidencia por prefijo del set y rareza (ej: "TN19" y "Prismatic Secret Rare")
  if (!match && targetCodeNorm) {
    const prefix = targetCodeNorm.split(/[0-9]/)[0] || targetCodeNorm.slice(0, 4);
    match = items.find(i => {
      const itemNumberNorm = normalize(i.customAttributes?.number);
      const numberMatches = itemNumberNorm.startsWith(prefix);
      const rarityMatches = targetRarityNorm ? normalize(i.rarityName).includes(targetRarityNorm) : true;
      return numberMatches && rarityMatches;
    });
  }

  // 3. Coincidencia por nombre de set y rareza
  if (!match && targetSetNameNorm) {
    match = items.find(i => {
      const setMatches = normalize(i.setName).includes(targetSetNameNorm);
      const rarityMatches = targetRarityNorm ? normalize(i.rarityName).includes(targetRarityNorm) : true;
      return setMatches && rarityMatches;
    });
  }

  // 4. Si no hubo coincidencia específica, usar el primer ítem que tenga precio de mercado
  if (!match) {
    match = items.find(i => typeof i.marketPrice === 'number') || items[0];
  }

  if (!match) {
    return { marketPrice: null, lowPrice: null, matchedNumber: null };
  }

  const marketPrice = typeof match.marketPrice === 'number' ? Number(match.marketPrice.toFixed(2)) : null;
  const lowPrice = typeof match.lowestPrice === 'number' ? Number(match.lowestPrice.toFixed(2)) : null;

  return {
    marketPrice,
    lowPrice,
    matchedNumber: match.customAttributes?.number || match.setCode || null,
  };
}

/**
 * Determina si el precio de una carta requiere actualización (más de 7 días o nunca actualizada).
 * @param {string|null} tcgPriceUpdatedAt
 * @returns {boolean}
 */
function isPriceOutdated(tcgPriceUpdatedAt) {
  if (!tcgPriceUpdatedAt) return true;
  const updatedTime = new Date(tcgPriceUpdatedAt).getTime();
  if (Number.isNaN(updatedTime)) return true;
  return (Date.now() - updatedTime) >= WEEK_IN_MS;
}

/**
 * Pausa la ejecución por los milisegundos especificados (evita rate limits).
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  searchTCGPlayer,
  getPriceForCard,
  isPriceOutdated,
  sleep,
};
