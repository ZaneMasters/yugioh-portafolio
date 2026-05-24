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
const MAX_CACHE_SIZE = 1000;

/** @type {Map<string, { uid: string|null, expiresAt: number }>} */
const cache = new Map();

const admin = require('firebase-admin');
const userRepository = require('../repositories/userRepository');

/**
 * @param {string} slug - Prefijo del email (ej. 'angel')
 * @returns {Promise<string|null>} UID de Firebase o null si no existe
 */
async function slugToUid(slug) {
  const slugLower = slug.toLowerCase();

  // 1. Evitar Memory Leaks limitando el tamaño del caché
  if (cache.size >= MAX_CACHE_SIZE) {
    logger.warn('⚠️ slugToUid cache lleno, limpiando...');
    const iterator = cache.keys();
    // Borramos el 20% más antiguo para liberar espacio
    for (let i = 0; i < MAX_CACHE_SIZE * 0.2; i++) {
      cache.delete(iterator.next().value);
    }
  }

  // 2. Cache hit
  const cached = cache.get(slugLower);
  if (cached !== undefined) {
    if (cached.expiresAt > Date.now()) {
      logger.debug(`⚡ slugToUid cache HIT → ${slugLower}`);
      return cached.uid; // Retorna null si es NOT_FOUND cacheado
    }
    cache.delete(slugLower); // expirado
  }

  // 2. Buscar en Firestore (nueva estrategia con slugs personalizados)
  try {
    const uidFromDb = await userRepository.getUidBySlug(slugLower);
    if (uidFromDb) {
      cache.set(slugLower, { uid: uidFromDb, expiresAt: Date.now() + CACHE_TTL_MS });
      logger.debug(`🔍 slugToUid FOUND (in DB) → ${slugLower} = ${uidFromDb}`);
      return uidFromDb;
    }

    // 3. Fallback: Buscar en Firebase Auth iterando usuarios (para cuentas antiguas que no han guardado perfil)
    let pageToken;
    do {
      const result = await admin.auth().listUsers(1000, pageToken);

      for (const user of result.users) {
        if (!user.email) continue;
        const prefix = user.email.split('@')[0].toLowerCase();
        
        if (prefix === slugLower) {
          // Validar que el usuario no tenga ya un slug personalizado distinto
          const userProfile = await userRepository.getProfile(user.uid);
          if (userProfile && userProfile.slug && userProfile.slug !== slugLower) {
            // Si tiene un slug guardado y es distinto al prefijo del correo, 
            // el prefijo antiguo ya no es válido.
            continue;
          }

          cache.set(slugLower, { uid: user.uid, expiresAt: Date.now() + CACHE_TTL_MS });
          logger.debug(`🔍 slugToUid FOUND (Fallback) → ${slugLower} = ${user.uid} (${user.email})`);
          return user.uid;
        }
      }
      pageToken = result.pageToken;
    } while (pageToken);

    // No se encontró
    cache.set(slugLower, { uid: null, expiresAt: Date.now() + CACHE_TTL_MS });
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
