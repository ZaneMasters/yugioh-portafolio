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
const INVENTORY_TTL          = 15 * 60; // 15 minutos

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

  // Buscar duplicado exacto (misma carta y mismos atributos físicos)
  const existing = await cardRepository.findExactDuplicate(externalCard.cardId, userId, dto);

  if (existing) {
    const updatedQuantity = existing.quantity + (quantity || 1);
    
    // Si la carta ya existe, y mandan folderIds, nos aseguramos de no perder los que ya tenía
    const existingFolderIds = Array.isArray(existing.folderIds) ? existing.folderIds : [];
    const newFolderIds = Array.isArray(dto.folderIds) ? dto.folderIds : [];
    const mergedFolderIds = [...new Set([...existingFolderIds, ...newFolderIds])];
    
    const updated = await cardRepository.update(
      existing.id, 
      { quantity: updatedQuantity, folderIds: mergedFolderIds }, 
      userId
    );
    logger.info(`♻️  Carta duplicada. Cantidad actualizada: ${existing.name} → ${updatedQuantity}`);
    invalidateInventoryCache(userId);
    return { card: updated, created: false };
  }

  // Determinar qué imagen usar (arte alternativo o primera por defecto)
  const selectedImageId = dto.selectedImageId ?? externalCard.cardId;
  const selectedImageUrl = externalCard.cardImages?.find(i => i.id === selectedImageId)?.image
    ?? externalCard.image;

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
    image:     selectedImageUrl,        // URL temporal (arte seleccionado)
    frameType: externalCard.frameType,
    condition: condition || 'new',
    quantity:  quantity  || 1,
    folderIds: Array.isArray(dto.folderIds) ? dto.folderIds : [],
    // —— Nuevos campos de la versión física ——
    setCode:         dto.setCode         ?? null,
    setName:         dto.setName         ?? null,
    rarity:          dto.rarity          ?? null,
    setPrice:        dto.setPrice        ?? null,
    selectedImageId: selectedImageId,
    edition:         dto.edition         ?? null,
    language:        dto.language        ?? null,
    tcgPrice:        externalCard.tcgPrice ?? null,
  });

  invalidateInventoryCache(userId);

  // ── Subida de imagen en segundo plano (fire-and-forget) ────────────────────────
  // Subimos el arte específico elegido por el usuario (no siempre el primero)
  setImmediate(() => {
    imageService.uploadCardImage(selectedImageId, selectedImageUrl)
      .then(async (storageUrl) => {
        if (storageUrl && storageUrl !== selectedImageUrl) {
          await cardRepository.update(newCard.id, { image: storageUrl }, null);
          invalidateInventoryCache(userId);
          logger.info(`🔄 Imagen actualizada a Storage para carta: ${externalCard.name} (arte: ${selectedImageId})`);
        }
      })
      .catch((err) => {
        // Error silencioso — la carta ya está guardada con la URL de YGOProdeck
        logger.warn(`⚠️  Background image upload falló para ${selectedImageId}: ${err.message}`);
      });
  });

  return { card: newCard, created: true };
}

// ── Listar cartas (galería pública / portafolio) ───────────────────────────────

/**
 * Retorna cartas con filtros opcionales, scope por usuario si se indica.
 * @param {Object} filters
 * @param {string|null} userId - null = sin filtro de usuario (legacy / global)
 * @param {{ limit?: number, cursor?: string, paginate?: boolean }} pagination
 */
async function listCards(filters = {}, userId = null, pagination = {}) {
  const { limit = 20, cursor = null, paginate = false } = pagination;

  // Clave para el inventario completo (sin filtrar)
  const rawKey = `${INVENTORY_CACHE_PREFIX}${userId || 'global'}:raw`;
  let rawCards = memCache.get(rawKey);

  if (!rawCards) {
    rawCards = await cardRepository.findAllRaw(userId);
    // Nota: memCache.set() usa su TTL por defecto que está sincronizado con el env.
    // Podría ajustarse a 15 min si el caché permite custom TTL, pero el default está bien.
    memCache.set(rawKey, rawCards);
    logger.debug(`💾 Raw Inventory cache SET → ${rawKey} (${rawCards.length} cartas)`);
  }

  // 1. Filtrado en memoria
  let cards = rawCards;

  if (filters.folderId) {
    cards = cards.filter(c => c.folderIds && c.folderIds.includes(filters.folderId));
  }
  if (filters.archetype) {
    const archLower = filters.archetype.toLowerCase();
    cards = cards.filter((c) => c.archetype && c.archetype.toLowerCase().includes(archLower));
  }
  if (filters.name) {
    const nameLower = filters.name.toLowerCase();
    cards = cards.filter((c) => c.name.toLowerCase().includes(nameLower));
  }
  if (filters.type) {
    const typeLower = filters.type.toLowerCase();
    cards = cards.filter((c) => {
      if (!c.type) return false;
      const cTypeLower = c.type.toLowerCase();
      if (cTypeLower.includes(typeLower)) return true;
      if (typeLower === 'effect monster') {
        const effectSubtypes = ['gemini', 'spirit', 'toon', 'flip monster', 'tuner monster'];
        return effectSubtypes.some(sub => cTypeLower.includes(sub));
      }
      return false;
    });
  }

  // 2. Ordenamiento (más reciente primero)
  cards.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  const totalCount = cards.length;

  if (!paginate) {
    return { cards, nextCursor: null, hasMore: false, totalCount };
  }

  // 3. Paginación visual en memoria basada en cursor
  let startIndex = 0;
  if (cursor) {
    const cursorIdx = cards.findIndex(c => c.id === cursor);
    if (cursorIdx !== -1) {
      startIndex = cursorIdx + 1;
    }
  }

  const pageDocs = cards.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < cards.length;
  const nextCursor = hasMore && pageDocs.length > 0 ? pageDocs[pageDocs.length - 1].id : null;

  return { cards: pageDocs, nextCursor, hasMore, totalCount };
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
  if (dto.condition    !== undefined) updates.condition    = dto.condition;
  if (dto.folderIds    !== undefined) updates.folderIds    = dto.folderIds;
  if (dto.isHidden     !== undefined) updates.isHidden     = dto.isHidden;
  if (dto.rarity       !== undefined) updates.rarity       = dto.rarity;

  // Campos de la versión física
  if (dto.setCode         !== undefined) updates.setCode         = dto.setCode;
  if (dto.setName         !== undefined) updates.setName         = dto.setName;
  if (dto.setPrice        !== undefined) updates.setPrice        = dto.setPrice;
  if (dto.selectedImageId !== undefined) updates.selectedImageId = dto.selectedImageId;
  if (dto.edition         !== undefined) updates.edition         = dto.edition;
  if (dto.language        !== undefined) updates.language        = dto.language;

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
