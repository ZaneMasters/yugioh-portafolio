'use strict';

const axios = require('axios');
const logger = require('../utils/logger');

const TCGCSV_BASE = 'https://tcgcsv.com/tcgplayer/2';
const TCG_SEARCH_URL = 'https://mp-search-api.tcgplayer.com/v1/search/request';

const GROUPS_TTL_MS = 24 * 60 * 60 * 1000;      // 24 horas para lista de grupos
const GROUP_DATA_TTL_MS = 2 * 60 * 60 * 1000;   // 2 horas para productos y precios de un set
const PRICE_CACHE_TTL_MS = 30 * 60 * 1000;      // 30 minutos para precio específico
const SEARCH_CACHE_TTL_MS = 15 * 60 * 1000;     // 15 minutos para búsquedas directas
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;     // 7 días

// Cachés en memoria
let groupsCache = null;
const groupDataCache = new Map();
const priceCache = new Map();
const searchCache = new Map();

/**
 * Normaliza cadenas para comparaciones flexibles (elimina espacios y caracteres no alfanuméricos)
 */
const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Equivalencias de rarezas oficiales de Yu-Gi-Oh en TCGPlayer
const RARITY_ALIASES = [
  ['pcr', 'prismaticcollector', 'prismaticcollectorsrare', 'collectorsrare', 'collectorrare'],
  ['pur', 'prismaticultimate', 'prismaticultimaterare'],
  ['ultimate', 'ultimaterare', 'utr'],
  ['qcsr', 'quartercentury', 'quartercenturysecretrare', 'quartercenturysecret', '25thsecret'],
  ['platinumsecret', 'platinumsecretrare', 'pser'],
  ['secret', 'secretrare', 'scr'],
  ['ultra', 'ultrarare', 'ur'],
  ['super', 'superrare', 'sr'],
  ['common', 'shortprint'],
  ['starlight', 'starlightrare'],
  ['ghost', 'ghostrare'],
  ['rare', 'r'],
];

/**
 * Compara dos cadenas de rareza considerando nombres completos, siglas y abreviaciones.
 */
function isSameRarity(r1, r2) {
  if (!r1 || !r2) return false;
  const n1 = normalize(r1);
  const n2 = normalize(r2);
  if (n1 === n2) return true;

  // Evitar falsos positivos como 'pur' emparejando con 'ultra rare'
  const isPurVsUltra = (n1.includes('pur') && n2.includes('ultra')) || (n2.includes('pur') && n1.includes('ultra'));
  if (!isPurVsUltra && (n1.includes(n2) || n2.includes(n1))) {
    return true;
  }

  return RARITY_ALIASES.some(group => group.includes(n1) && group.includes(n2));
}

/**
 * Selecciona el producto que mejor coincide con la rareza solicitada dentro de un conjunto de variantes
 * del mismo código de expansión (ej: Rarity Collection donde un mismo setCode tiene hasta 7 rarezas).
 */
function findBestRarityMatch(products, targetRarity) {
  if (!targetRarity || products.length <= 1) return products[0];
  const targetNorm = normalize(targetRarity);

  // 1. Coincidencia EXACTA de rareza normalizada en extendedData.Rarity
  let exact = products.find(p => {
    const rVal = p.extendedData?.find(e => e.name === 'Rarity')?.value;
    return rVal && normalize(rVal) === targetNorm;
  });
  if (exact) return exact;

  // 2. Coincidencia EXACTA en el nombre del producto, ej: '(Secret Rare)'
  exact = products.find(p => {
    const pNorm = normalize(p.name);
    return pNorm.endsWith(targetNorm) || p.name.toLowerCase().includes(`(${targetRarity.toLowerCase()})`);
  });
  if (exact) return exact;

  // 3. Modificadores de exclusión para evitar que 'Secret Rare' capture 'Platinum Secret Rare' o 'Quarter Century'
  const isPlatinum = targetNorm.includes('platinum') || targetNorm.includes('pser');
  const isQuarter = targetNorm.includes('quarter') || targetNorm.includes('qcsr') || targetNorm.includes('25th');
  const isCollector = targetNorm.includes('collector') || targetNorm.includes('pcr');
  const isUltimate = targetNorm.includes('ultimate') || targetNorm.includes('pur') || targetNorm.includes('utr');

  const filtered = products.filter(p => {
    const pNorm = normalize((p.extendedData?.find(e => e.name === 'Rarity')?.value || '') + ' ' + p.name);
    if (!isPlatinum && pNorm.includes('platinum')) return false;
    if (!isQuarter && (pNorm.includes('quarter') || pNorm.includes('qcsr') || pNorm.includes('25th'))) return false;
    if (!isCollector && (pNorm.includes('collector') || pNorm.includes('pcr'))) return false;
    if (!isUltimate && (pNorm.includes('ultimate') || pNorm.includes('pur'))) return false;
    return true;
  });

  const pool = filtered.length > 0 ? filtered : products;

  // 4. Buscar coincidencia en el pool filtrado
  const match = pool.find(p => {
    const rVal = p.extendedData?.find(e => e.name === 'Rarity')?.value;
    return isSameRarity(rVal, targetRarity) || isSameRarity(p.name, targetRarity);
  });

  return match || pool[0] || products[0];
}

const csvAxios = axios.create({
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'YugiohPortfolio/1.0 (https://yugioh-8fc03.web.app)',
  },
});

const tcgAxios = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'application/json',
  },
});

/**
 * Obtiene la lista completa de grupos (sets) de Yu-Gi-Oh desde el mirror público de TCGPlayer.
 */
async function getTCGGroups() {
  if (groupsCache && Date.now() < groupsCache.expiresAt) {
    return groupsCache.groups;
  }

  try {
    const res = await csvAxios.get(`${TCGCSV_BASE}/groups`);
    const groups = res.data?.results || [];
    groupsCache = {
      groups,
      expiresAt: Date.now() + GROUPS_TTL_MS,
    };
    return groups;
  } catch (err) {
    logger.warn(`⚠️ Error al obtener grupos de TCGPlayer (TCGCSV): ${err.message}`);
    return groupsCache ? groupsCache.groups : [];
  }
}

/**
 * Obtiene los productos y precios de un grupo específico desde TCGCSV con caché en memoria.
 */
async function getGroupProductsAndPrices(groupId) {
  const cached = groupDataCache.get(groupId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached;
  }

  try {
    const [prodRes, priceRes] = await Promise.all([
      csvAxios.get(`${TCGCSV_BASE}/${groupId}/products`),
      csvAxios.get(`${TCGCSV_BASE}/${groupId}/prices`),
    ]);

    const data = {
      products: prodRes.data?.results || [],
      prices: priceRes.data?.results || [],
      expiresAt: Date.now() + GROUP_DATA_TTL_MS,
    };

    groupDataCache.set(groupId, data);

    // Limpieza periódica de caché
    if (groupDataCache.size > 200) {
      const now = Date.now();
      for (const [k, v] of groupDataCache.entries()) {
        if (now > v.expiresAt) groupDataCache.delete(k);
      }
    }

    return data;
  } catch (err) {
    logger.warn(`⚠️ Error al obtener catálogo de grupo ${groupId} (TCGCSV): ${err.message}`);
    return { products: [], prices: [] };
  }
}

/**
 * Busca el precio de una carta en TCGCSV a partir de su setCode y rareza.
 */
async function getPriceFromTCGCSV(cardName, setCode, rarity = null, setName = null) {
  if (!setCode || typeof setCode !== 'string') return null;

  const cleanCode = setCode.trim().toUpperCase();
  const prefix = cleanCode.split('-')[0].trim();

  const groups = await getTCGGroups();
  if (!groups || groups.length === 0) return null;

  // 1. Encontrar el grupo por abreviatura exacta o prefijo
  let group = groups.find(g => (g.abbreviation || '').toUpperCase() === prefix);

  // 2. Si no coincide exacto, buscar si el código empieza con la abreviatura del grupo
  if (!group) {
    group = groups.find(g => {
      const gAbbr = (g.abbreviation || '').toUpperCase();
      return gAbbr && (cleanCode.startsWith(gAbbr) || prefix.startsWith(gAbbr));
    });
  }

  // 3. Si no coincide y se proporcionó setName, buscar por nombre del set
  if (!group && setName) {
    const normSetName = normalize(setName);
    group = groups.find(g => {
      const gNorm = normalize(g.name);
      return gNorm === normSetName || gNorm.includes(normSetName) || normSetName.includes(gNorm);
    });
  }

  if (!group) return null;

  const { products, prices } = await getGroupProductsAndPrices(group.groupId);
  if (!products || products.length === 0 || !prices || prices.length === 0) {
    return null;
  }

  const normCode = normalize(cleanCode);

  // Buscar coincidencia exacta por número de carta en extendedData
  let matchingProds = products.filter(p => {
    const num = normalize(p.extendedData?.find(e => e.name === 'Number')?.value);
    return num && (num === normCode || num.includes(normCode) || normCode.includes(num));
  });

  // Si no coincide directo (ej: carta en idioma español BLVO-SP001 vs BLVO-EN001 en TCGPlayer)
  if (matchingProds.length === 0) {
    const parts = cleanCode.split('-');
    const digits = (parts[1] || '').replace(/[^0-9]/g, '');
    if (digits) {
      matchingProds = products.filter(p => {
        const num = p.extendedData?.find(e => e.name === 'Number')?.value || '';
        const pDigits = (num.split('-')[1] || '').replace(/[^0-9]/g, '');
        return pDigits && pDigits === digits;
      });
    }
  }

  // Si aún no hay match, intentar por coincidencia de nombre de producto con el nombre de la carta
  if (matchingProds.length === 0 && cardName) {
    const normCardName = normalize(cardName);
    matchingProds = products.filter(p => {
      const pNorm = normalize(p.name);
      return pNorm === normCardName || pNorm.includes(normCardName) || normCardName.includes(pNorm);
    });
  }

  if (matchingProds.length === 0) return null;

  // Seleccionar el producto según la rareza exacta si hay múltiples variantes (ej: Rarity Collection)
  const matchedProd = findBestRarityMatch(matchingProds, rarity);

  const priceObj = prices.find(p => p.productId === matchedProd.productId);
  if (!priceObj) return null;

  const marketPrice = typeof priceObj.marketPrice === 'number' ? Number(priceObj.marketPrice.toFixed(2)) : null;
  const lowPrice = typeof priceObj.lowPrice === 'number' ? Number(priceObj.lowPrice.toFixed(2)) : null;

  if (marketPrice === null && lowPrice === null) return null;

  return {
    marketPrice,
    lowPrice,
    matchedNumber: matchedProd.extendedData?.find(e => e.name === 'Number')?.value || cleanCode,
    productName: matchedProd.name,
  };
}

/**
 * Realiza una búsqueda directa en TCGPlayer por nombre de carta (fallback secundario).
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

    searchCache.set(cacheKey, {
      items,
      expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
    });

    if (searchCache.size > 500) {
      const now = Date.now();
      for (const [k, v] of searchCache.entries()) {
        if (now > v.expiresAt) searchCache.delete(k);
      }
    }

    return items;
  } catch (err) {
    const statusInfo = err.response?.status ? ` (Status: ${err.response.status})` : '';
    logger.debug(`TCGPlayer direct search "${cardName}": ${err.message}${statusInfo}`);
    return [];
  }
}

/**
 * Realiza una búsqueda directa en TCGPlayer filtrando por setCode (fallback secundario).
 * @param {string} setCode
 * @returns {Promise<Array>} Lista de productos con ese código exacto
 */
async function searchBySetCode(setCode) {
  if (!setCode || typeof setCode !== 'string') return [];

  const cleanCode = setCode.trim().toUpperCase();
  const cacheKey = `setcode:${cleanCode}`;

  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.items;
  }

  try {
    const payload = {
      algorithm: '',
      fromPath: 'search',
      size: 24,
      context: { cart: {} },
      settings: { useTCGStandardSizes: true },
      sort: {},
      filters: {
        term: {
          Number: [cleanCode],
        },
      },
    };

    const response = await tcgAxios.post(TCG_SEARCH_URL, payload);
    const items = response.data?.results?.[0]?.results || [];

    searchCache.set(cacheKey, {
      items,
      expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
    });

    return items;
  } catch (err) {
    const statusInfo = err.response?.status ? ` (Status: ${err.response.status})` : '';
    logger.debug(`TCGPlayer direct setCode "${setCode}": ${err.message}${statusInfo}`);
    return [];
  }
}

/**
 * Obtiene el precio de mercado y precio más bajo de una carta específica en TCGPlayer.
 * Exclusivo para cartas que cuentan con setCode (número de expansión).
 *
 * @param {string} cardName - Nombre de la carta (ej: "Armed Dragon Thunder LV10")
 * @param {string|null} setCode - Código de la expansión (ej: "BLVO-EN001" o "RA05-EN076")
 * @param {string|null} rarity - Rareza opcional (ej: "Secret Rare", "PCR")
 * @param {string|null} setName - Nombre de la expansión opcional
 * @returns {Promise<{ marketPrice: number|null, lowPrice: number|null, matchedNumber: string|null }>}
 */
async function getPriceForCard(cardName, setCode = null, rarity = null, setName = null) {
  if (!setCode || typeof setCode !== 'string' || !setCode.trim()) {
    return { marketPrice: null, lowPrice: null, matchedNumber: null };
  }

  const cleanCode = setCode.trim().toUpperCase();
  const cleanRarity = (rarity || '').trim();
  const cacheKey = `${cleanCode}|${cleanRarity.toLowerCase()}`;

  const cached = priceCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.priceInfo;
  }

  // 1. Intentar primero con el mirror oficial de TCGPlayer (TCGCSV)
  // No sufre de bloqueos 403 en entornos Cloud Run y contiene todo el catálogo diario de TCGPlayer
  try {
    const csvPrice = await getPriceFromTCGCSV(cardName, cleanCode, cleanRarity, setName);
    if (csvPrice && (csvPrice.marketPrice !== null || csvPrice.lowPrice !== null)) {
      const result = {
        marketPrice: csvPrice.marketPrice,
        lowPrice: csvPrice.lowPrice,
        matchedNumber: csvPrice.matchedNumber || cleanCode,
      };

      priceCache.set(cacheKey, {
        priceInfo: result,
        expiresAt: Date.now() + PRICE_CACHE_TTL_MS,
      });

      return result;
    }
  } catch (err) {
    logger.warn(`⚠️ Error consultando precio TCGCSV para "${cardName}" (${cleanCode}): ${err.message}`);
  }

  // 2. Si no se encontró en el mirror, intentar con la API directa de TCGPlayer
  let items = await searchBySetCode(cleanCode);

  if (!items || items.length === 0) {
    if (cardName) {
      const nameItems = await searchTCGPlayer(cardName);
      if (nameItems && nameItems.length > 0) {
        const matchingCode = nameItems.filter(i => {
          const num = normalize(i.customAttributes?.number || i.setCode);
          const cleanNorm = normalize(cleanCode);
          return num && (num.includes(cleanNorm) || cleanNorm.includes(num));
        });
        items = matchingCode.length > 0 ? matchingCode : nameItems;
      }
    }
  }

  if (!items || items.length === 0) {
    return { marketPrice: null, lowPrice: null, matchedNumber: null };
  }

  let match = null;
  const targetRarityNorm = normalize(cleanRarity);

  if (targetRarityNorm) {
    // 1. Coincidencia exacta
    match = items.find(i => normalize(i.rarityName) === targetRarityNorm);

    // 2. Modificadores de exclusión
    if (!match) {
      const isPlatinum = targetRarityNorm.includes('platinum') || targetRarityNorm.includes('pser');
      const isQuarter = targetRarityNorm.includes('quarter') || targetRarityNorm.includes('qcsr') || targetRarityNorm.includes('25th');
      const isCollector = targetRarityNorm.includes('collector') || targetRarityNorm.includes('pcr');
      const isUltimate = targetRarityNorm.includes('ultimate') || targetRarityNorm.includes('pur') || targetRarityNorm.includes('utr');

      const filtered = items.filter(i => {
        const iNorm = normalize((i.rarityName || '') + ' ' + (i.productName || ''));
        if (!isPlatinum && iNorm.includes('platinum')) return false;
        if (!isQuarter && (iNorm.includes('quarter') || iNorm.includes('qcsr') || iNorm.includes('25th'))) return false;
        if (!isCollector && (iNorm.includes('collector') || iNorm.includes('pcr'))) return false;
        if (!isUltimate && (iNorm.includes('ultimate') || iNorm.includes('pur'))) return false;
        return true;
      });

      const pool = filtered.length > 0 ? filtered : items;
      match = pool.find(i => isSameRarity(i.rarityName, cleanRarity) || isSameRarity(i.productName, cleanRarity));
    }
  }

  if (!match) {
    match = items.find(i => typeof i.marketPrice === 'number') || items[0];
  }

  if (!match) {
    return { marketPrice: null, lowPrice: null, matchedNumber: null };
  }

  const marketPrice = typeof match.marketPrice === 'number' ? Number(match.marketPrice.toFixed(2)) : null;
  const lowPrice = typeof match.lowestPrice === 'number' ? Number(match.lowestPrice.toFixed(2)) : null;

  const result = {
    marketPrice,
    lowPrice,
    matchedNumber: match.customAttributes?.number || match.setCode || cleanCode,
  };

  priceCache.set(cacheKey, {
    priceInfo: result,
    expiresAt: Date.now() + PRICE_CACHE_TTL_MS,
  });

  return result;
}

const DAY_IN_MS = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Determina si el precio de una carta requiere actualización (por defecto más de 7 días o nunca actualizada).
 * @param {string|null} tcgPriceUpdatedAt
 * @param {number} [maxAgeMs=WEEK_IN_MS]
 * @returns {boolean}
 */
function isPriceOutdated(tcgPriceUpdatedAt, maxAgeMs = WEEK_IN_MS) {
  if (!tcgPriceUpdatedAt) return true;
  const updatedTime = new Date(tcgPriceUpdatedAt).getTime();
  if (Number.isNaN(updatedTime)) return true;
  return (Date.now() - updatedTime) >= maxAgeMs;
}

/**
 * Pausa la ejecución por los milisegundos especificados (evita rate limits).
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  searchTCGPlayer,
  searchBySetCode,
  getPriceForCard,
  isPriceOutdated,
  sleep,
};
