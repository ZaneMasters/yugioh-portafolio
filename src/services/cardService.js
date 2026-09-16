'use strict';

const cardRepository  = require('../repositories/cardRepository');
const ygoService      = require('./ygoService');
const imageService    = require('./imageService');
const tcgPlayerService = require('./tcgPlayerService');
const memCache        = require('../utils/cache');
const AppError        = require('../utils/AppError');
const logger          = require('../utils/logger');

// Conjunto de usuarios con sincronización de precios activa para evitar solapamientos
const syncingUsers = new Set();

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
 * @param {Object} dto - { name?, cardId?, quantity? }
 * @param {string} userId - UID de Firebase del propietario
 */
async function registerCard(dto, userId) {
  const { name, cardId, quantity, lang = 'en' } = dto;

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

  // Consultar precio oficial en vivo de TCGPlayer solo si la carta se guarda con código de set
  let livePrice = { marketPrice: null, lowPrice: null };
  if (dto.setCode && dto.setCode.trim()) {
    try {
      livePrice = await tcgPlayerService.getPriceForCard(
        externalCard.name,
        dto.setCode,
        dto.rarity,
        dto.setName
      );
    } catch (err) {
      logger.warn(`⚠️ Error al consultar precio TCGPlayer para "${externalCard.name}" (${dto.setCode}): ${err.message}`);
    }
  }

  const tcgMarketPrice    = livePrice.marketPrice ?? null;
  const tcgLowPrice       = livePrice.lowPrice ?? null;
  const tcgPriceUpdatedAt = livePrice.marketPrice !== null ? new Date().toISOString() : null;

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
    quantity:  quantity  || 1,
    folderIds: Array.isArray(dto.folderIds) ? dto.folderIds : [],
    // —— Campos de la versión física ——
    setCode:           dto.setCode         ?? null,
    setName:           dto.setName         ?? null,
    rarity:            dto.rarity          ?? null,
    selectedImageId:   selectedImageId,
    edition:           dto.edition         ?? null,
    language:          dto.language        ?? null,
    tcgMarketPrice:    tcgMarketPrice,
    tcgLowPrice:       tcgLowPrice,
    tcgPriceUpdatedAt: tcgPriceUpdatedAt,
    tcgPrice:          tcgMarketPrice !== null ? String(tcgMarketPrice) : null,
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

  // ── Lazy Sync semanal en segundo plano (fire-and-forget) ──────────────────────
  // Solo sincronizar cartas que tengan código de expansión (setCode)
  if (userId && !syncingUsers.has(userId) && Array.isArray(rawCards) && rawCards.length > 0) {
    const hasOutdated = rawCards.some(c => !!c.setCode && tcgPlayerService.isPriceOutdated(c.tcgPriceUpdatedAt));
    if (hasOutdated) {
      setImmediate(() => {
        syncUserCardPrices(userId, false).catch(err => {
          logger.warn(`⚠️ Error en lazy sync de precios para ${userId}: ${err.message}`);
        });
      });
    }
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
  if (dto.folderIds    !== undefined) updates.folderIds    = dto.folderIds;
  if (dto.isHidden     !== undefined) updates.isHidden     = dto.isHidden;
  if (dto.rarity       !== undefined) updates.rarity       = dto.rarity;

  // Campos de la versión física
  if (dto.setCode         !== undefined) updates.setCode         = dto.setCode;
  if (dto.setName         !== undefined) updates.setName         = dto.setName;
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

// ── Sincronización de precios TCGPlayer ───────────────────────────────────────

/**
 * Sincroniza los precios de TCGPlayer de las cartas del inventario de un usuario.
 * Solo procesa cartas que tengan asignado un código de expansión (setCode).
 *
 * @param {string} userId - UID del usuario
 * @param {boolean} forceAll - Si es true, actualiza todas las cartas con código sin importar la fecha
 * @returns {Promise<{ total: number, updated: number, errors: number, inProgress?: boolean }>}
 */
async function syncUserCardPrices(userId, forceAll = false) {
  if (!userId) return { total: 0, updated: 0, errors: 0 };
  if (syncingUsers.has(userId)) {
    logger.info(`⏳ Sincronización TCGPlayer ya en progreso para el usuario ${userId}`);
    return { total: 0, updated: 0, errors: 0, inProgress: true };
  }

  syncingUsers.add(userId);
  try {
    const rawCards = await cardRepository.findAllRaw(userId);
    // Filtrar únicamente cartas que tengan código de expansión (setCode)
    const cardsWithCode = rawCards.filter(c => !!c.setCode && c.setCode.trim().length > 0);
    const targetCards = forceAll
      ? cardsWithCode
      : cardsWithCode.filter(c => tcgPlayerService.isPriceOutdated(c.tcgPriceUpdatedAt));

    if (targetCards.length === 0) {
      logger.info(`✨ No hay cartas con código de set pendientes de actualizar para ${userId}.`);
      return { total: 0, updated: 0, errors: 0 };
    }

    logger.info(`🔄 Iniciando sincronización TCGPlayer para ${userId}: ${targetCards.length} de ${rawCards.length} cartas.`);

    let updated = 0;
    let errors = 0;

    for (const card of targetCards) {
      try {
        const priceInfo = await tcgPlayerService.getPriceForCard(
          card.name,
          card.setCode,
          card.rarity,
          card.setName
        );

        if (priceInfo.marketPrice !== null) {
          const updates = {
            tcgMarketPrice: priceInfo.marketPrice,
            tcgLowPrice: priceInfo.lowPrice ?? null,
            tcgPrice: String(priceInfo.marketPrice),
            tcgPriceUpdatedAt: new Date().toISOString(),
          };

          await cardRepository.update(card.id, updates, userId);
          updated++;
        }

        // Breve pausa para no saturar la API
        await tcgPlayerService.sleep(200);
      } catch (err) {
        logger.warn(`⚠️ Error al actualizar precio de carta ${card.id} (${card.name}): ${err.message}`);
        errors++;
      }
    }

    // Siempre invalidar la caché de inventario al terminar la sincronización
    invalidateInventoryCache(userId);

    logger.info(`✅ Sincronización TCGPlayer completada para ${userId}: ${updated} cartas actualizadas, ${errors} errores.`);
    return { total: targetCards.length, updated, errors };
  } finally {
    syncingUsers.delete(userId);
  }
}

/**
 * Busca cartas exclusivamente por código de set / expansión.
 * Consulta el catálogo general y cruza con las cartas de la comunidad
 * para mostrar qué coleccionistas la tienen disponible.
 *
 * @param {string} setCode
 * @returns {Promise<Array>}
 */
async function searchBySetCode(setCode) {
  if (!setCode || !setCode.trim()) return [];
  const query = setCode.trim();

  // 1. Buscar en catálogo general en memoria por set
  const catalogCards = await ygoService.searchCards(query, 'set');

  // 2. Buscar en Firestore si algún usuario de la comunidad tiene copias registradas
  const { getFirestore } = require('../config/firebase');
  const db = getFirestore();
  const normalizedQuery = query.toLowerCase().replace(/[^a-z0-9]/g, '');

  try {
    const [cardsSnap, usersSnap] = await Promise.all([
      db.collection('cards').get(),
      db.collection('users').get(),
    ]);

    const userMap = {};
    usersSnap.forEach((u) => {
      const data = u.data();
      userMap[u.id] = {
        slug: data.slug,
        displayName: data.slug ? data.slug.charAt(0).toUpperCase() + data.slug.slice(1) : 'Coleccionista',
        whatsapp: data.whatsapp || null,
      };
    });

    const ownersByCardId = {};
    cardsSnap.forEach((doc) => {
      const cardData = doc.data();
      const cCode = (cardData.setCode || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cCode && (cCode.includes(normalizedQuery) || normalizedQuery.includes(cCode))) {
        const owner = userMap[cardData.userId];
        if (owner) {
          const cId = cardData.cardId;
          if (!ownersByCardId[cId]) ownersByCardId[cId] = [];
          ownersByCardId[cId].push({
            id: doc.id,
            slug: owner.slug,
            displayName: owner.displayName,
            whatsapp: owner.whatsapp,
            quantity: cardData.quantity || 1,
            rarity: cardData.rarity || null,
            edition: cardData.edition || null,
            setCode: cardData.setCode,
            price: cardData.tcgMarketPrice || cardData.tcgPrice || null,
          });
        }
      }
    });

    // 3. Enriquecer los resultados del catálogo con precios en vivo y disponibilidad en comunidad
    const enrichedCards = await Promise.all(
      catalogCards.map(async (c) => {
        const matchingSet = c.cardSets?.find((s) => {
          const sCode = (s.setCode || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          return sCode.includes(normalizedQuery) || normalizedQuery.includes(sCode);
        }) || c.cardSets?.[0] || null;

        const owners = ownersByCardId[c.cardId] || [];

        // Consultar precios oficiales TCGPlayer en vivo para este set code exacto
        let tcgPrices = { marketPrice: null, lowPrice: null };
        if (matchingSet?.setCode) {
          try {
            tcgPrices = await tcgPlayerService.getPriceForCard(
              c.name,
              matchingSet.setCode,
              matchingSet.rarity,
              matchingSet.setName
            );
          } catch (err) {
            logger.debug(`No se pudo obtener precio TCGPlayer para "${c.name}" (${matchingSet.setCode}): ${err.message}`);
          }
        }

        // Si hay dueños de la comunidad con precio, calcular el precio más bajo en comunidad
        const communityPrices = owners
          .map((o) => (typeof o.price === 'number' ? o.price : parseFloat(o.price)))
          .filter((p) => !isNaN(p) && p > 0);
        const minCommunityPrice = communityPrices.length > 0 ? Math.min(...communityPrices) : null;

        return {
          ...c,
          marketPrice: tcgPrices.marketPrice,
          lowPrice: tcgPrices.lowPrice,
          minCommunityPrice,
          matchedSet: {
            ...matchingSet,
            marketPrice: tcgPrices.marketPrice,
            lowPrice: tcgPrices.lowPrice,
          },
          communityOwners: owners,
          availableInCommunity: owners.length > 0,
        };
      })
    );

    return enrichedCards;
  } catch (err) {
    logger.warn(`Error cruzando disponibilidad en comunidad para set "${setCode}": ${err.message}`);
    return catalogCards.map((c) => ({
      ...c,
      marketPrice: null,
      lowPrice: null,
      minCommunityPrice: null,
      matchedSet:
        c.cardSets?.find((s) => {
          const sCode = (s.setCode || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          return sCode.includes(normalizedQuery) || normalizedQuery.includes(sCode);
        }) || c.cardSets?.[0] || null,
      communityOwners: [],
      availableInCommunity: false,
    }));
  }
}

module.exports = {
  registerCard,
  listCards,
  getCardById,
  updateCard,
  deleteCard,
  syncUserCardPrices,
  invalidateInventoryCache,
  searchBySetCode,
};

