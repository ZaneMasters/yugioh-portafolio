'use strict';

const wishlistRepository = require('../repositories/wishlistRepository');
const ygoService     = require('./ygoService');
const imageService   = require('./imageService');
const memCache       = require('../utils/cache');
const AppError       = require('../utils/AppError');
const logger         = require('../utils/logger');

const WISHLIST_CACHE_PREFIX = 'wishlist:';
const WISHLIST_TTL          = 2 * 60; // 2 minutos

function wishlistKey(userId, filters = {}) {
  const sorted = Object.keys(filters).sort().map(k => `${k}=${filters[k]}`).join('&');
  return `${WISHLIST_CACHE_PREFIX}${userId || 'global'}:${sorted || 'all'}`;
}

function invalidateWishlistCache(userId) {
  const prefix = `${WISHLIST_CACHE_PREFIX}${userId || 'global'}:`;
  for (const key of memCache.store.keys()) {
    if (key.startsWith(prefix)) {
      memCache.delete(key);
    }
  }
  logger.debug(`🗑️  Wishlist cache invalidated → userId: ${userId || 'global'}`);
}

async function registerCard(dto, userId) {
  const { name, cardId, rarity, quantity, lang = 'en' } = dto;

  let externalCard;
  if (cardId) {
    externalCard = await ygoService.getByCardId(cardId, lang);
  } else {
    externalCard = await ygoService.getByExactName(name, lang);
  }

  logger.info(`🔍 Carta encontrada en API (Wishlist): ${externalCard.name} (ID: ${externalCard.cardId})`);

  // Buscar duplicado con misma rareza dentro de la wishlist del mismo usuario
  const existing = await wishlistRepository.findByCardIdAndRarity(externalCard.cardId, rarity, userId);

  if (existing) {
    const updatedQuantity = existing.quantity + (quantity || 1);
    const updated = await wishlistRepository.update(existing.id, { quantity: updatedQuantity }, userId);
    logger.info(`♻️  Carta duplicada en wishlist. Cantidad actualizada: ${existing.name} → ${updatedQuantity}`);
    invalidateWishlistCache(userId);
    return { card: updated, created: false };
  }

  const newCard = await wishlistRepository.create({
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
    image:     externalCard.image,
    frameType: externalCard.frameType,
    rarity:    rarity || 'Any',
    quantity:  quantity  || 1,
  });

  invalidateWishlistCache(userId);

  setImmediate(() => {
    imageService.uploadCardImage(externalCard.cardId, externalCard.image)
      .then(async (storageUrl) => {
        if (storageUrl && storageUrl !== externalCard.image) {
          await wishlistRepository.update(newCard.id, { image: storageUrl }, null);
          invalidateWishlistCache(userId);
        }
      })
      .catch((err) => logger.error(`Error optimizando imagen de wishlist (${externalCard.cardId}):`, err));
  });

  return { card: newCard, created: true };
}

async function listCards(filters, userId, pagination = {}) {
  const cacheKey = wishlistKey(userId, filters);
  const cached = memCache.get(cacheKey);

  if (cached && !pagination.paginate) {
    logger.debug(`⚡ Wishlist cache HIT: ${cacheKey}`);
    return cached;
  }

  const result = await wishlistRepository.findAll(filters, userId, pagination);

  if (!pagination.paginate) {
    memCache.set(cacheKey, result, WISHLIST_TTL);
    logger.debug(`💾 Wishlist cache SET: ${cacheKey}`);
  }

  return result;
}

async function updateCard(id, updates, userId) {
  const allowedFields = ['quantity', 'rarity', 'isHidden'];
  const payload = {};
  
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      payload[field] = updates[field];
    }
  }

  if (Object.keys(payload).length === 0) {
    throw new AppError('Ningún campo válido para actualizar.', 400);
  }

  const updated = await wishlistRepository.update(id, payload, userId);
  invalidateWishlistCache(userId);
  return updated;
}

async function deleteCard(id, userId) {
  await wishlistRepository.delete(id, userId);
  invalidateWishlistCache(userId);
}

module.exports = {
  registerCard,
  listCards,
  updateCard,
  deleteCard,
};
