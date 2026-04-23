'use strict';

const cardRepository = require('../repositories/cardRepository');
const ygoService     = require('./ygoService');
const imageService   = require('./imageService');
const memCache       = require('../utils/cache');
const AppError       = require('../utils/AppError');
const logger         = require('../utils/logger');

/**
 * Servicio de inventario de cartas — Lógica de negocio.
 *
 * Multi-tenant: cada operación recibe `userId` para aislar datos por propietario.
 *
 * Caché del inventario:
 *  - Clave: `inventory:${userId}:${filtros}` → cache independiente por usuario
 *  - TTL: 2 minutos (INVENTORY_TTL)
 *  - Invalidación: POST/PUT/DELETE borran solo el cache del usuario afectado
 */

const INVENTORY_CACHE_PREFIX = 'inventory:';
const INVENTORY_TTL          = 2 * 60; // 2 minutos

/** Genera la clave de caché por usuario y filtros */
function inventoryKey(userId, filters = {}) {
  const sorted = Object.keys(filters).sort().map(k => `${k}=${filters[k]}`).join('&');
  return `${INVENTORY_CACHE_PREFIX}${userId || 'global'}:${sorted || 'all'}`;
}

/** Invalida todas las entradas de caché del usuario dado */
function invalidateInventoryCache(userId) {
  const prefix = `${INVENTORY_CACHE_PREFIX}${userId || 'global'}:`;
  for (const key of memCache.store.keys()) {
    if (key.startsWith(prefix)) {
      memCache.delete(key);
    }
  }
  logger.debug(`🗑️  Inventory cache invalidated → userId: ${userId || 'global'}`);
}

// ── Registrar carta ────────────────────────────────────────────────────────────

/**
 * Registra una carta en el inventario del usuario.
 * @param {Object} dto - { name?, cardId?, condition?, quantity? }
 * @param {string} userId - UID de Firebase del propietario
 */
async function registerCard(dto, userId) {
  const { name, cardId, condition, quantity, lang = 'en' } = dto;

  let externalCard;
  if (cardId) {
    externalCard = await ygoService.getByCardId(cardId, lang);
  } else {
    externalCard = await ygoService.getByExactName(name, lang);
  }

  logger.info(`🔍 Carta encontrada en API: ${externalCard.name} (ID: ${externalCard.cardId})`);

  // Buscar duplicado dentro del inventario del mismo usuario
  const existing = await cardRepository.findByCardId(externalCard.cardId, userId);

  if (existing) {
    const updatedQuantity = existing.quantity + (quantity || 1);
    const updated = await cardRepository.update(existing.id, { quantity: updatedQuantity }, userId);
    logger.info(`♻️  Carta duplicada. Cantidad actualizada: ${existing.name} → ${updatedQuantity}`);
    invalidateInventoryCache(userId);
    return { card: updated, created: false };
  }

  // Guardar la carta inmediatamente con la URL de YGOProdeck (respuesta rápida al usuario)
  const newCard = await cardRepository.create({
    userId,
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
    image:     externalCard.image,      // URL temporal de YGOProdeck
    frameType: externalCard.frameType,
    condition: condition || 'new',
    quantity:  quantity  || 1,
  });

  invalidateInventoryCache(userId);

  // ── Subida de imagen en segundo plano (fire-and-forget) ───────────────────
  // No bloqueamos la respuesta — la imagen se comprime y sube a Storage
  // de forma asíncrona y luego se actualiza el campo image en Firestore.
  setImmediate(() => {
    imageService.uploadCardImage(externalCard.cardId, externalCard.image)
      .then(async (storageUrl) => {
        if (storageUrl && storageUrl !== externalCard.image) {
          await cardRepository.update(newCard.id, { image: storageUrl }, null);
          invalidateInventoryCache(userId);
          logger.info(`🔄 Imagen actualizada a Storage para carta: ${externalCard.name}`);
        }
      })
      .catch((err) => {
        // Error silencioso — la carta ya está guardada con la URL de YGOProdeck
        logger.warn(`⚠️  Background image upload falló para ${externalCard.cardId}: ${err.message}`);
      });
  });

  return { card: newCard, created: true };
}

// ── Listar cartas (galería pública / portafolio) ───────────────────────────────

/**
 * Retorna cartas con filtros opcionales, scope por usuario si se indica.
 * @param {Object} filters
 * @param {string|null} userId - null = sin filtro de usuario (legacy / global)
 */
async function listCards(filters = {}, userId = null) {
  const key    = inventoryKey(userId, filters);
  const cached = memCache.get(key);

  if (cached) {
    logger.debug(`⚡ Inventory cache HIT → ${key}`);
    return cached;
  }

  const cards = await cardRepository.findAll(filters, userId);
  memCache.set(key, cards);
  logger.debug(`💾 Inventory cache SET → ${key} (${cards.length} cartas)`);
  return cards;
}

// ── Obtener carta por ID ───────────────────────────────────────────────────────

async function getCardById(id) {
  return cardRepository.findById(id);
}

// ── Actualizar carta ───────────────────────────────────────────────────────────

async function updateCard(id, dto, userId) {
  const updates = {};

  if (dto.quantity !== undefined) {
    if (dto.quantity < 0) throw new AppError('La cantidad no puede ser negativa.', 400);
    updates.quantity = dto.quantity;
  }

  if (dto.condition !== undefined) {
    updates.condition = dto.condition;
  }

  const card = await cardRepository.update(id, updates, userId);
  invalidateInventoryCache(userId);
  return card;
}

// ── Eliminar carta ─────────────────────────────────────────────────────────────

async function deleteCard(id, userId) {
  const result = await cardRepository.delete(id, userId);
  invalidateInventoryCache(userId);
  return result;
}

module.exports = {
  registerCard,
  listCards,
  getCardById,
  updateCard,
  deleteCard,
};
