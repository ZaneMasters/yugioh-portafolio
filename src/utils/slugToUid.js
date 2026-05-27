'use strict';

const logger = require('./logger');
const userRepository = require('../repositories/userRepository');

/**
 * Mapea un slug a su Firebase UID consultando la coleccion 'users' en Firestore.
 *
 * Desde que getProfile() auto-crea el documento en el primer login,
 * todos los usuarios tienen su slug guardado en Firestore.
 * El fallback de listUsers() (costoso y lento) ya no es necesario.
 *
 * Estrategia:
 *  1. Cache en RAM (Map) con TTL de 10 min — evita Firestore en visitas repetidas
 *  2. Firestore users WHERE slug == slug — lookup directo, ~30ms
 *  3. null si no existe
 */

const CACHE_TTL_MS  = 10 * 60 * 1000; // 10 minutos
const MAX_CACHE_SIZE = 1000;

/** @type {Map<string, { uid: string|null, expiresAt: number }>} */
const cache = new Map();

/**
 * @param {string} slug
 * @returns {Promise<string|null>} UID de Firebase o null si no existe
 */
async function slugToUid(slug) {
  const slugLower = slug.toLowerCase();

  // ── 1. Evitar memory leak limitando el tamaño del cache ──────────────────
  if (cache.size >= MAX_CACHE_SIZE) {
    logger.warn('⚠️ slugToUid cache lleno, limpiando 20% mas antiguo...');
    const iterator = cache.keys();
    for (let i = 0; i < MAX_CACHE_SIZE * 0.2; i++) {
      cache.delete(iterator.next().value);
    }
  }

  // ── 2. Cache hit ──────────────────────────────────────────────────────────
  const cached = cache.get(slugLower);
  if (cached !== undefined) {
    if (cached.expiresAt > Date.now()) {
      logger.debug(`⚡ slugToUid cache HIT → ${slugLower}`);
      return cached.uid;
    }
    cache.delete(slugLower); // expirado
  }

  // ── 3. Firestore lookup ───────────────────────────────────────────────────
  try {
    const uid = await userRepository.getUidBySlug(slugLower);

    // Cachear resultado (positivo o negativo) para evitar Firestore en proximas visitas
    cache.set(slugLower, { uid: uid ?? null, expiresAt: Date.now() + CACHE_TTL_MS });

    if (uid) {
      logger.debug(`🔍 slugToUid FOUND → ${slugLower} = ${uid}`);
    } else {
      logger.warn(`⚠️  slugToUid NOT FOUND → "${slugLower}" no existe en la coleccion users`);
    }

    return uid ?? null;
  } catch (err) {
    logger.error(`❌ slugToUid error → ${err.message}`);
    throw err;
  }
}

/** Invalida una entrada especifica del cache (ej. al cambiar el slug) */
function invalidateSlugCache(slug) {
  cache.delete(slug.toLowerCase());
}

module.exports = { slugToUid, invalidateSlugCache };
