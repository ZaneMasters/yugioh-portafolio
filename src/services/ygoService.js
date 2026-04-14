'use strict';

const axios = require('axios');
const { YGO_API_BASE_URL } = require('../config/env');
const memCache     = require('../utils/cache');          // Nivel 1: LRU en memoria
const firestoreCache = require('../repositories/cacheRepository'); // Nivel 2: Firestore
const AppError = require('../utils/AppError');
const logger   = require('../utils/logger');

/**
 * Servicio de integración con la API externa de YGOProdeck.
 *
 * Estrategia de caché de 3 niveles:
 *  1. LRU en memoria  — ~0ms   — vive mientras el proceso esté activo
 *  2. Firestore       — ~20ms  — persiste entre reinicios y cold starts
 *  3. YGOProdeck API  — ~400ms — solo si ninguna caché tiene el dato
 */

const SEARCH_TTL = 5 * 60;   // 5 minutos para búsquedas
const CARD_TTL   = 60 * 60;  // 1 hora para cartas individuales

const ygoAxios = axios.create({
  baseURL: YGO_API_BASE_URL,
  timeout: 8000,
  headers: { 'Accept': 'application/json' },
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
  memCache.set(key, data);
  firestoreCache.set(key, data, ttl).catch(() => {}); // fire-and-forget

  return data;
}

// ── Funciones públicas ─────────────────────────────────────────────────────────

/**
 * Busca cartas en YGOProdeck por nombre (búsqueda parcial con fname).
 */
async function searchByName(name) {
  const key = `search:name:${name.toLowerCase()}`;
  return withCache(key, SEARCH_TTL, async () => {
    const response = await ygoAxios.get('/cardinfo.php', { params: { fname: name } });
    return response.data.data.map(mapExternalCard);
  });
}

/**
 * Obtiene una carta específica por su cardId de la API externa.
 */
async function getByCardId(cardId) {
  const id  = Number(cardId);
  const key = `card:id:${id}`;
  return withCache(key, CARD_TTL, async () => {
    const response = await ygoAxios.get('/cardinfo.php', { params: { id } });
    if (!response.data.data || response.data.data.length === 0) {
      throw new AppError(`Carta con ID ${id} no encontrada en la API externa.`, 404);
    }
    return mapExternalCard(response.data.data[0]);
  });
}

/**
 * Obtiene una carta por nombre exacto.
 */
async function getByExactName(name) {
  const key = `card:name:${name.toLowerCase()}`;
  return withCache(key, CARD_TTL, async () => {
    const response = await ygoAxios.get('/cardinfo.php', { params: { name } });
    if (!response.data.data || response.data.data.length === 0) {
      throw new AppError(`Carta "${name}" no encontrada en la API externa.`, 404);
    }
    return mapExternalCard(response.data.data[0]);
  });
}

module.exports = { searchByName, getByCardId, getByExactName, mapExternalCard };

