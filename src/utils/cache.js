'use strict';

const { CACHE_TTL_SECONDS, CACHE_MAX_SIZE } = require('../config/env');
const logger = require('./logger');

/**
 * Cache LRU simple en memoria para resultados de la API externa.
 *
 * Implementación manual sin dependencias externas:
 *  - Map preserva el orden de inserción → útil para LRU
 *  - Cada entrada guarda el valor y su timestamp de expiración
 */
class MemoryCache {
  constructor(ttlSeconds = CACHE_TTL_SECONDS, maxSize = CACHE_MAX_SIZE) {
    this.store = new Map();
    this.ttlMs = ttlSeconds * 1000;
    this.maxSize = maxSize;
  }

  /**
   * Obtiene un valor si existe y no ha expirado.
   * @param {string} key
   * @returns {any|null}
   */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    // Actualizar posición LRU (mover al final)
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  /**
   * Almacena un valor con TTL.
   * Si se supera maxSize, elimina la entrada más antigua (LRU).
   * @param {string} key
   * @param {any} value
   */
  set(key, value) {
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxSize) {
      // Eliminar el primer elemento (más antiguo / menos recientemente usado)
      const firstKey = this.store.keys().next().value;
      this.store.delete(firstKey);
      logger.debug(`🗑️  Cache LRU: evicted key "${firstKey}"`);
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  /**
   * Elimina una entrada específica de la cache.
   * @param {string} key
   */
  delete(key) {
    this.store.delete(key);
  }

  /**
   * Limpia todas las entradas expiradas.
   */
  purgeExpired() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /** Número de entradas activas en cache. */
  get size() {
    return this.store.size;
  }

  /** Vacía toda la cache. */
  flush() {
    this.store.clear();
  }
}

// Singleton compartido por toda la aplicación
const cache = new MemoryCache();

// Purgar entradas expiradas cada 10 minutos
setInterval(() => {
  cache.purgeExpired();
  logger.debug(`🧹 Cache purge — entradas activas: ${cache.size}`);
}, 10 * 60 * 1000).unref(); // .unref() para que no bloquee el cierre del proceso

module.exports = cache;
