'use strict';

const cardRepository = require('../repositories/cardRepository');
const ygoService     = require('./ygoService');
const memCache       = require('../utils/cache');
const AppError       = require('../utils/AppError');
const logger         = require('../utils/logger');

/**
 * Servicio de inventario de cartas — Lógica de negocio.
 *
 * Caché del inventario (galería pública):
 *  - Lee: LRU en memoria con TTL de 2 min → evita consultas a Firestore en cada visita
 *  - Invalidación: POST/PUT/DELETE borran la caché → próxima visita lee datos frescos
 *
 * Orquesta comunicación entre:
 *  - cardRepository (Firestore)
 *  - ygoService (API externa)
 */

// Clave de caché para el inventario completo (sin filtros)
const INVENTORY_CACHE_PREFIX = 'inventory:'
const INVENTORY_TTL          = 2 * 60 // 2 minutos

/** Genera la clave de caché según los filtros aplicados */
function inventoryKey(filters = {}) {
  const sorted = Object.keys(filters).sort().map(k => `${k}=${filters[k]}`).join('&')
  return `${INVENTORY_CACHE_PREFIX}${sorted || 'all'}`
}

/** Invalida todas las entradas de caché del inventario cuando hay una escritura */
function invalidateInventoryCache() {
  // La LRU no soporta wildcard — iteramos el store interno para borrar prefijo
  for (const key of memCache.store.keys()) {
    if (key.startsWith(INVENTORY_CACHE_PREFIX)) {
      memCache.delete(key)
    }
  }
  logger.debug('🗑️  Inventory cache invalidated')
}

// ── Registrar carta ────────────────────────────────────────────────────────────

async function registerCard(dto) {
  const { name, cardId, condition, quantity } = dto;

  let externalCard;
  if (cardId) {
    externalCard = await ygoService.getByCardId(cardId);
  } else {
    externalCard = await ygoService.getByExactName(name);
  }

  logger.info(`🔍 Carta encontrada en API: ${externalCard.name} (ID: ${externalCard.cardId})`);

  const existing = await cardRepository.findByCardId(externalCard.cardId);

  if (existing) {
    const updatedQuantity = existing.quantity + (quantity || 1);
    const updated = await cardRepository.update(existing.id, { quantity: updatedQuantity });
    logger.info(`♻️  Carta duplicada. Cantidad actualizada: ${existing.name} → ${updatedQuantity}`);
    invalidateInventoryCache(); // ← galería verá el cambio en la próxima visita
    return { card: updated, created: false };
  }

  const newCard = await cardRepository.create({
    cardId:    externalCard.cardId,
    name:      externalCard.name,
    type:      externalCard.type,
    race:      externalCard.race,
    attribute: externalCard.attribute,
    archetype: externalCard.archetype,
    level:     externalCard.level,
    atk:       externalCard.atk,
    def:       externalCard.def,
    desc:      externalCard.desc,
    image:     externalCard.image,
    frameType: externalCard.frameType,
    condition: condition || 'new',
    quantity:  quantity  || 1,
  });

  invalidateInventoryCache(); // ← galería verá la nueva carta
  return { card: newCard, created: true };
}

// ── Listar cartas (galería pública) ───────────────────────────────────────────

/**
 * Retorna todas las cartas del inventario con filtros opcionales.
 * Respetadas desde la caché LRU si están disponibles.
 */
async function listCards(filters = {}) {
  const key    = inventoryKey(filters)
  const cached = memCache.get(key)

  if (cached) {
    logger.debug(`⚡ Inventory cache HIT → ${key}`)
    return cached
  }

  const cards = await cardRepository.findAll(filters);
  memCache.set(key, cards) // TTL por defecto de la instancia (CACHE_TTL_SECONDS del .env)
  logger.debug(`💾 Inventory cache SET → ${key} (${cards.length} cartas)`)
  return cards
}

// ── Obtener carta por ID ───────────────────────────────────────────────────────

async function getCardById(id) {
  return cardRepository.findById(id);
}

// ── Actualizar carta ───────────────────────────────────────────────────────────

async function updateCard(id, dto) {
  const updates = {};

  if (dto.quantity !== undefined) {
    if (dto.quantity < 0) throw new AppError('La cantidad no puede ser negativa.', 400);
    updates.quantity = dto.quantity;
  }

  if (dto.condition !== undefined) {
    updates.condition = dto.condition;
  }

  const card = await cardRepository.update(id, updates);
  invalidateInventoryCache(); // ← galería siempre verá datos actualizados
  return card;
}

// ── Eliminar carta ─────────────────────────────────────────────────────────────

async function deleteCard(id) {
  const result = await cardRepository.delete(id);
  invalidateInventoryCache(); // ← carta desaparece de la galería
  return result;
}

module.exports = {
  registerCard,
  listCards,
  getCardById,
  updateCard,
  deleteCard,
};

