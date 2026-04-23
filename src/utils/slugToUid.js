'use strict';

const { getFirestore } = require('../config/firebase');
const logger = require('./logger');

/**
 * Mapea un slug de usuario (prefijo del email) a su Firebase UID.
 *
 * Estrategia:
 *  - El frontend guarda users/{slug} en Firestore al hacer login (AuthContext.jsx)
 *  - Aquí solo hacemos un lookup: db.collection('users').doc(slug).get()
 *  - Sin asumir dominio de email, sin listUsers(), sin getUserByEmail()
 *
 * Ejemplo: slugToUid('angel') → lee users/angel → devuelve uid
 */

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

/** @type {Map<string, { uid: string, expiresAt: number } | 'NOT_FOUND'>} */
const cache = new Map();

const admin = require('firebase-admin');

/**
 * @param {string} slug - Prefijo del email (ej. 'angel')
 * @returns {Promise<string|null>} UID de Firebase o null si no existe
 */
async function slugToUid(slug) {
  const slugLower = slug.toLowerCase();

  // 1. Cache hit
  const cached = cache.get(slugLower);
  if (cached !== undefined) {
    if (cached === 'NOT_FOUND' || cached.expiresAt > Date.now()) {
      logger.debug(`⚡ slugToUid cache HIT → ${slugLower}`);
      return cached === 'NOT_FOUND' ? null : cached.uid;
    }
    cache.delete(slugLower); // expirado
  }

  // 2. Buscar en Firebase Auth iterando usuarios
  try {
    let pageToken;
    do {
      const result = await admin.auth().listUsers(1000, pageToken);

      for (const user of result.users) {
        if (!user.email) continue;
        const prefix = user.email.split('@')[0].toLowerCase();
        
        if (prefix === slugLower) {
          cache.set(slugLower, { uid: user.uid, expiresAt: Date.now() + CACHE_TTL_MS });
          logger.debug(`🔍 slugToUid FOUND → ${slugLower} = ${user.uid} (${user.email})`);
          return user.uid;
        }
      }
      pageToken = result.pageToken;
    } while (pageToken);

    // No se encontró
    cache.set(slugLower, 'NOT_FOUND');
    logger.warn(`⚠️  slugToUid NOT FOUND → no existe usuario con prefijo de email "${slugLower}"`);
    return null;
  } catch (err) {
    logger.error(`❌ slugToUid error → ${err.message}`);
    throw err;
  }
}

/** Invalida una entrada específica del cache */
function invalidateSlugCache(slug) {
  cache.delete(slug.toLowerCase());
}

module.exports = { slugToUid, invalidateSlugCache };
