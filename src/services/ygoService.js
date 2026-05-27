'use strict';

const axios = require('axios');
const { YGO_API_BASE_URL } = require('../config/env');
const memCache     = require('../utils/cache');          // Nivel 1: LRU en memoria
const firestoreCache = require('../repositories/cacheRepository'); // Nivel 2: Firestore
const AppError = require('../utils/AppError');
const logger   = require('../utils/logger');
const catalogService = require('./catalogService');

/**
 * Servicio de integración con la API externa de YGOProdeck.
 *
 * Estrategia de caché de 3 niveles:
 *  1. LRU en memoria  — ~0ms   — vive mientras el proceso esté activo
 *  2. Firestore       — ~20ms  — persiste entre reinicios y cold starts
 *  3. YGOProdeck API  — ~400ms — solo si ninguna caché tiene el dato
 */

const SEARCH_TTL = 30 * 60;  // 30 minutos para búsquedas (YGOProdeck es intermitente)
const CARD_TTL   = 60 * 60;  // 1 hora para cartas individuales

// Reintentos ante fallos 5xx de YGOProdeck (reducido para no hacer esperar al usuario)
const MAX_RETRIES  = 1;
const RETRY_DELAY  = 300; // ms base

const ygoAxios = axios.create({
  baseURL: YGO_API_BASE_URL,
  timeout: 12000,
  headers: { 'Accept': 'application/json' },
  // YGOProdeck devuelve 500 si los espacios se envían como '+' o si las comas se envían como '%2C'
  // Axios por defecto usa '+' para espacios y codifica comas en URLSearchParams.
  // Forzamos que se envíe como '%20' y preservamos las comas para evitar que su API colapse.
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

// ── Retry helper ────────────────────────────────────────────────────────────────

/**
 * Ejecuta fn con reintentos ante errores 5xx de YGOProdeck.
 * YGOProdeck es conocido por devolver 500 de forma intermitente en
 * búsquedas con muchos resultados, sin que sea un error real.
 *
 * @param {Function} fn        — función async que hace la petición
 * @param {number}   retries   — intentos restantes
 * @param {number}   delayMs   — espera antes del siguiente intento
 */
async function withRetry(fn, retries = MAX_RETRIES, delayMs = RETRY_DELAY) {
  try {
    return await fn();
  } catch (err) {
    const status = err.response?.status;
    const errorMessage = err.response?.data?.error;
    
    // No reintentar si es el error determinista de "mismatch"
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

// ── Transformación ─────────────────────────────────────────────────────────────

function mapExternalCard(rawCard) {
  return {
    cardId:    rawCard.id,
    name:      rawCard.name,
    type:      rawCard.type,
    race:      rawCard.race,
    attribute: rawCard.attribute    || null,
    archetype: rawCard.archetype    || null,
    level:     rawCard.level        || null,
    atk:       rawCard.atk          !== undefined ? rawCard.atk : null,
    def:       rawCard.def          !== undefined ? rawCard.def : null,
    desc:      rawCard.desc         || null,
    image:     rawCard.card_images?.[0]?.image_url       || null,
    imageSmall: rawCard.card_images?.[0]?.image_url_small || null,
    frameType: rawCard.frameType    || null,
  };
}

// ── Helper: Caché de 3 niveles ─────────────────────────────────────────────────

/**
 * Wrapper genérico que aplica la estrategia de caché de 3 niveles.
 * @param {string} key    — clave de caché
 * @param {number} ttl    — TTL en segundos
 * @param {Function} fetch — función que obtiene el dato real de YGOProdeck
 */
async function withCache(key, ttl, fetch) {
  // ── Nivel 1: LRU en memoria ────────────────────────────────────────────────
  const memHit = memCache.get(key);
  if (memHit) {
    logger.debug(`⚡ Memoria cache HIT → ${key}`);
    return memHit;
  }

  // ── Nivel 2: Firestore ────────────────────────────────────────────────────
  const fsHit = await firestoreCache.get(key);
  if (fsHit) {
    memCache.set(key, fsHit); // promover a memoria para próximas lecturas
    return fsHit;
  }

  // ── Nivel 3: API externa ──────────────────────────────────────────────────
  logger.debug(`🌐 Cache MISS total → ${key} — consultando YGOProdeck`);
  const data = await fetch();

  // Guardar en ambos niveles en paralelo (no bloqueamos la respuesta)
  // No cachear resultados vacíos — pueden ser queries demasiado genéricas o errores upstream
  const hasData = Array.isArray(data) ? data.length > 0 : data != null;
  if (hasData) {
    memCache.set(key, data);
    firestoreCache.set(key, data, ttl).catch(() => {}); // fire-and-forget
  }

  return data;
}

// ── Funciones públicas ─────────────────────────────────────────────────────────

/**
 * Busca cartas en el catálogo local en memoria por nombre o arquetipo.
 * Si lang no es 'en', hace fallback a la API de YGOProdeck (ya que nuestro catálogo en memoria es en inglés).
 */
async function searchCards(query, type = 'name', lang = 'en') {
  const normalized = query.toLowerCase();
  const key = `search:${type}:${normalized}:lang:${lang}`;

  return withCache(key, SEARCH_TTL, async () => {
    // Si la búsqueda es en español, la delegamos a la antigua API externa,
    // ya que nuestro motor de búsqueda local en RAM solo descarga el catálogo en inglés.
    if (lang !== 'en') {
      const params = type === 'archetype' ? { archetype: query } : { fname: query };
      params.language = lang;
      try {
        const response = await withRetry(() => ygoAxios.get('/cardinfo.php', { params }));
        return response.data.data.map(mapExternalCard);
      } catch (err) {
        if (err.response?.status === 400) return [];
        throw new AppError('Error al buscar en YGOProdeck en español.', 500);
      }
    }

    // Búsqueda en el catálogo local (Inglés) - Súper rápida y robusta
    try {
      let rawResults = [];
      if (type === 'archetype') {
        rawResults = await catalogService.searchArchetype(query);
      } else {
        rawResults = await catalogService.searchCardsFuzzy(query);
      }
      
      return rawResults.map(mapExternalCard);
    } catch (err) {
      logger.error(`Error en búsqueda local (${type}): ${query} - ${err.message}`);
      throw new AppError('El motor de búsqueda aún se está iniciando, por favor intenta en unos segundos.', 503);
    }
  });
}

/**
 * Obtiene una carta específica por su cardId de la API externa.
 */
async function getByCardId(cardId, lang = 'en') {
  const id  = Number(cardId);
  const key = `card:id:${id}:lang:${lang}`;
  return withCache(key, CARD_TTL, async () => {
    const params = { id };
    if (lang !== 'en') params.language = lang;

    try {
      const response = await ygoAxios.get('/cardinfo.php', { params });
      if (!response.data.data || response.data.data.length === 0) {
        throw new AppError(`Carta con ID ${id} no encontrada en la API externa.`, 404);
      }
      return mapExternalCard(response.data.data[0]);
    } catch (err) {
      if (err.response && err.response.status === 400) {
        throw new AppError(`Carta con ID ${id} no encontrada en la API externa.`, 404);
      }
      throw err;
    }
  });
}

/**
 * Obtiene una carta por nombre exacto.
 */
async function getByExactName(name, lang = 'en') {
  const key = `card:name:${name.toLowerCase()}:lang:${lang}`;
  return withCache(key, CARD_TTL, async () => {
    const params = { name };
    if (lang !== 'en') params.language = lang;

    try {
      const response = await ygoAxios.get('/cardinfo.php', { params });
      if (!response.data.data || response.data.data.length === 0) {
        throw new AppError(`Carta "${name}" no encontrada en la API externa.`, 404);
      }
      return mapExternalCard(response.data.data[0]);
    } catch (err) {
      if (err.response && err.response.status === 400) {
        throw new AppError(`Carta "${name}" no encontrada en la API externa.`, 404);
      }
      throw err;
    }
  });
}

module.exports = { searchCards, getByCardId, getByExactName, mapExternalCard };
