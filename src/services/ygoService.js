'use strict';

const axios      = require('axios');
const { YGO_API_BASE_URL } = require('../config/env');
const AppError       = require('../utils/AppError');
const logger         = require('../utils/logger');
const catalogService = require('./catalogService');

/**
 * Servicio de integración con YGOProdeck y el catálogo local en memoria.
 *
 * Todas las búsquedas de cartas en inglés se resuelven directamente desde
 * el catálogo en RAM (cargado por catalogService), sin caché intermedia ni
 * llamadas externas. El catálogo es más rápido que cualquier capa de caché.
 *
 * YGOProdeck solo se consulta para:
 *  - Cartas por ID/nombre exacto que no estén en el catálogo local (edge case)
 */

// Reintentos ante fallos 5xx de YGOProdeck
const MAX_RETRIES = 1;
const RETRY_DELAY = 300; // ms base

const ygoAxios = axios.create({
  baseURL: YGO_API_BASE_URL,
  timeout: 12000,
  headers: { 'Accept': 'application/json' },
  // YGOProdeck devuelve 500 si los espacios se envían como '+' o si las comas se envían como '%2C'
  // Forzamos '%20' y preservamos las comas para evitar colapsos de su API.
  paramsSerializer: {
    serialize: (params) => {
      return new URLSearchParams(params).toString()
        .replace(/\+/g, '%20')
        .replace(/%2C/gi, ',');
    }
  }
});

ygoAxios.interceptors.request.use((config) => {
  logger.debug(`🌐 YGO API Request → ${config.baseURL}${config.url} | params: ${JSON.stringify(config.params)}`);
  return config;
});

ygoAxios.interceptors.response.use(
  (response) => {
    logger.debug(`✅ YGO API Response [${response.status}] → ${response.config.url}`);
    return response;
  },
  (error) => {
    logger.warn(`❌ YGO API Error [${error.response?.status}]: ${error.message}`);
    return Promise.reject(error);
  },
);

// ── Retry helper ─────────────────────────────────────────────────────────────

/**
 * Ejecuta fn con reintentos ante errores 5xx de YGOProdeck.
 * YGOProdeck es conocido por devolver 500 de forma intermitente en
 * búsquedas con muchos resultados, sin que sea un error real.
 */
async function withRetry(fn, retries = MAX_RETRIES, delayMs = RETRY_DELAY) {
  try {
    return await fn();
  } catch (err) {
    const status       = err.response?.status;
    const errorMessage = err.response?.data?.error;

    const isRetryable = (status >= 500 || !err.response) &&
                        errorMessage !== 'Database query parameter mismatch.';

    if (isRetryable && retries > 0) {
      logger.warn(`🔄 YGOProdeck ${status ?? 'network'} — reintentando en ${delayMs}ms (intentos restantes: ${retries})`);
      await new Promise((r) => setTimeout(r, delayMs));
      return withRetry(fn, retries - 1, delayMs * 2); // backoff exponencial
    }

    throw err;
  }
}

// ── Transformación ────────────────────────────────────────────────────────────

function mapExternalCard(rawCard) {
  // Cuando viene del catálogo local (buildIndex), card_images tiene {id, s}
  // Cuando viene directo de la API de YGOProdeck, tiene {id, image_url, image_url_small}
  const normalizeImages = (imgs) => {
    if (!Array.isArray(imgs)) return [];
    return imgs.map(i => ({
      id:         i.id,
      imageSmall: i.s ?? i.image_url_small ?? null,
      // URL full: reconstruir desde el ID (evita guardar la URL larga en RAM)
      image:      i.image_url ?? `https://images.ygoprodeck.com/images/cards/${i.id}.jpg`,
    }));
  };

  const images = normalizeImages(rawCard.card_images);

  // Sets del catálogo local: {n, c, r, p} → expandir a nombres completos para el frontend
  const normalizeSets = (sets) => {
    if (!Array.isArray(sets)) return [];
    return sets.map(s => ({
      setName:   s.n ?? s.set_name   ?? null,
      setCode:   s.c ?? s.set_code   ?? null,
      rarity:    s.r ?? s.set_rarity ?? null,
      setPrice:  s.p ?? s.set_price  ?? null,
    }));
  };

  return {
    cardId:     rawCard.id        ?? rawCard.cardId,
    name:       rawCard.name,
    type:       rawCard.type,
    race:       rawCard.race      ?? null,
    attribute:  rawCard.attribute ?? null,
    archetype:  rawCard.archetype ?? null,
    level:      rawCard.level     ?? null,
    atk:        rawCard.atk       !== undefined ? rawCard.atk : null,
    def:        rawCard.def       !== undefined ? rawCard.def : null,
    desc:       rawCard.desc      ?? null,
    // Primera imagen (compatibilidad con código existente)
    image:      images[0]?.image      ?? rawCard.card_images?.[0]?.image_url ?? rawCard.image ?? null,
    imageSmall: images[0]?.imageSmall ?? rawCard.card_images?.[0]?.image_url_small ?? rawCard.imageSmall ?? null,
    frameType:  rawCard.frameType ?? null,
    // Nuevos campos enriquecidos
    cardImages: images,                                // Todas las artes
    cardSets:   normalizeSets(rawCard.card_sets),      // Todas las expansiones con precio
    tcgPrice:   rawCard.tcgPrice ?? rawCard.card_prices?.[0]?.tcgplayer_price ?? null,
  };
}

// ── Funciones públicas ────────────────────────────────────────────────────────

/**
 * Busca cartas por nombre o arquetipo en el catálogo local en memoria.
 * Resolución directa desde RAM — sin caché intermedia ni llamadas externas.
 *
 * @param {string} query
 * @param {'name'|'archetype'} type
 */
async function searchCards(query, type = 'name') {
  try {
    let rawResults = [];

    if (type === 'archetype') {
      rawResults = await catalogService.searchArchetype(query);
    } else if (type === 'set') {
      rawResults = await catalogService.searchBySet(query);
    } else {
      rawResults = await catalogService.searchCardsFuzzy(query);
    }

    return rawResults.map(mapExternalCard);
  } catch (err) {
    logger.error(`Error en búsqueda local (${type}): "${query}" — ${err.message}`);
    throw new AppError('El motor de búsqueda aún se está iniciando, por favor intenta en unos segundos.', 503);
  }
}

/**
 * Obtiene una carta específica por su cardId.
 * Primero busca en el catálogo local (RAM). Si no está, consulta YGOProdeck
 * como fallback (edge case: carta muy reciente no incluida en el backup semanal).
 *
 * @param {number|string} cardId
 */
async function getByCardId(cardId) {
  const id = Number(cardId);

  // Intentar catálogo local primero (O(n) pero sin latencia de red)
  const localCard = await catalogService.getCardById(id);
  if (localCard) {
    logger.debug(`⚡ Carta ID ${id} resuelta desde catálogo local`);
    return mapExternalCard(localCard);
  }

  // Fallback a YGOProdeck si la carta no está en el catálogo (carta nueva, etc.)
  logger.debug(`🌐 Carta ID ${id} no encontrada en catálogo local — consultando YGOProdeck`);
  try {
    const response = await withRetry(() => ygoAxios.get('/cardinfo.php', { params: { id } }));
    if (!response.data.data?.length) {
      throw new AppError(`Carta con ID ${id} no encontrada.`, 404);
    }
    return mapExternalCard(response.data.data[0]);
  } catch (err) {
    if (err.response?.status === 400) {
      throw new AppError(`Carta con ID ${id} no encontrada.`, 404);
    }
    throw err;
  }
}

/**
 * Obtiene una carta por nombre exacto.
 * Primero busca en el catálogo local. Si no está, consulta YGOProdeck.
 *
 * @param {string} name
 */
async function getByExactName(name) {
  // Buscar en catálogo local por nombre exacto (case-insensitive)
  const normalizedQuery = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const status = await catalogService.getStatus();

  if (status.isLoaded) {
    // Reutilizamos searchCardsFuzzy y filtramos por nombre exacto normalizado
    const results = await catalogService.searchCardsFuzzy(name);
    const exact   = results.find(c => c._searchName === normalizedQuery);
    if (exact) {
      logger.debug(`⚡ Carta "${name}" resuelta desde catálogo local`);
      return mapExternalCard(exact);
    }
  }

  // Fallback a YGOProdeck
  logger.debug(`🌐 Carta "${name}" no encontrada en catálogo local — consultando YGOProdeck`);
  try {
    const response = await withRetry(() => ygoAxios.get('/cardinfo.php', { params: { name } }));
    if (!response.data.data?.length) {
      throw new AppError(`Carta "${name}" no encontrada.`, 404);
    }
    return mapExternalCard(response.data.data[0]);
  } catch (err) {
    if (err.response?.status === 400) {
      throw new AppError(`Carta "${name}" no encontrada.`, 404);
    }
    throw err;
  }
}

module.exports = { searchCards, getByCardId, getByExactName, mapExternalCard };
