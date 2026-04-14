'use strict';

const { getFirestore } = require('../config/firebase');
const logger = require('../utils/logger');

const COLLECTION = 'ygo_external_cache';

/**
 * Repositorio de caché persistente usando Firestore.
 *
 * Estructura de cada documento:
 * {
 *   key:      string,    // clave de búsqueda (mismo que el doc ID)
 *   payload:  any,       // datos cacheados (array de cartas o carta individual)
 *   cachedAt: Timestamp, // cuándo se guardó
 *   expiresAt: Timestamp // cuándo expira — Firestore TTL Policy puede limpiar esto
 * }
 *
 * Para activar limpieza automática en Firestore Console:
 *  → Database → TTL Policies → Add TTL Policy
 *  → Collection: ygo_external_cache → Field: expiresAt
 */

/**
 * Obtiene un valor de la caché de Firestore.
 * @param {string} key
 * @returns {Promise<any|null>} datos o null si no existe/expiró
 */
async function get(key) {
  try {
    const db  = getFirestore();
    const ref = db.collection(COLLECTION).doc(sanitizeKey(key));
    const doc = await ref.get();

    if (!doc.exists) return null;

    const data = doc.data();

    // Verificar expiración manual (por si TTL policy de Firestore no la limpió aún)
    if (data.expiresAt && data.expiresAt.toMillis() < Date.now()) {
      logger.debug(`⏰ Firestore cache EXPIRED → ${key}`);
      ref.delete().catch(() => {}); // eliminar en background, sin await
      return null;
    }

    logger.debug(`💾 Firestore cache HIT → ${key}`);
    return data.payload;
  } catch (err) {
    // Si Firestore falla, no rompemos la app — simplemente cache miss
    logger.warn(`⚠️  Firestore cache GET error: ${err.message}`);
    return null;
  }
}

/**
 * Guarda un valor en la caché de Firestore con TTL.
 * @param {string} key
 * @param {any} payload
 * @param {number} ttlSeconds
 */
async function set(key, payload, ttlSeconds) {
  try {
    const db        = getFirestore();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    await db.collection(COLLECTION).doc(sanitizeKey(key)).set({
      key,
      payload,
      cachedAt:  new Date(),
      expiresAt, // usado por TTL Policy de Firestore para auto-borrar
    });

    logger.debug(`💾 Firestore cache SET → ${key} (TTL: ${ttlSeconds}s)`);
  } catch (err) {
    // Si Firestore falla al escribir, solo logueamos — no rompemos la app
    logger.warn(`⚠️  Firestore cache SET error: ${err.message}`);
  }
}

/**
 * Elimina una entrada de la caché de Firestore.
 * @param {string} key
 */
async function del(key) {
  try {
    const db = getFirestore();
    await db.collection(COLLECTION).doc(sanitizeKey(key)).delete();
    logger.debug(`🗑️  Firestore cache DEL → ${key}`);
  } catch (err) {
    logger.warn(`⚠️  Firestore cache DEL error: ${err.message}`);
  }
}

/**
 * Firestore no acepta '/', ' ' ni ciertos chars especiales en document IDs.
 * Sanitiza la clave para usarla como doc ID seguro.
 */
function sanitizeKey(key) {
  return key
    .toLowerCase()
    .replace(/[^a-z0-9:_-]/g, '_') // reemplaza chars no válidos
    .substring(0, 1500)             // límite de ID de Firestore
}

module.exports = { get, set, del };
