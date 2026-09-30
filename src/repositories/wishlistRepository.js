'use strict';

const { getFirestore } = require('../config/firebase');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const COLLECTION = 'wishlist';

/**
 * Repositorio de Wishlist — Capa de acceso a datos (Firestore).
 * Colección separada para las cartas que el usuario está buscando.
 *
 * Multi-tenant: todos los métodos de lectura/escritura aceptan `userId`
 * para aislar las cartas por propietario.
 */
class WishlistRepository {
  constructor() {
    this.db = getFirestore();
    this.collection = this.db.collection(COLLECTION);
  }

  // ── READ ──────────────────────────────────────────────────────────────────────

  /**
   * Obtiene documentos con filtros opcionales y paginación cursor-based.
   *
   * @param {{ name?: string, type?: string, archetype?: string }} filters
   * @param {string|null} userId
   * @param {{ limit?: number, cursor?: string, paginate?: boolean }} pagination
   * @returns {Promise<{ cards: Array, nextCursor: string|null, hasMore: boolean }>}
   */
  async findAll(filters = {}, userId = null, pagination = {}) {
    const { limit = 20, cursor = null, paginate = false } = pagination;

    let query = this.collection;
    if (userId) query = query.where('userId', '==', userId);

    // Aplicar filtros nativos primero si los hay
    if (filters.type) query = query.where('type', '==', filters.type);

    const snapshot = await query.get();
    let cards = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Filtrar cartas públicas si se solicita explícitamente (ignorar las que tengan isHidden === true)
    if (filters.onlyPublic) {
      cards = cards.filter((c) => c.isHidden !== true);
    }

    if (filters.archetype) {
      const archLower = filters.archetype.toLowerCase();
      cards = cards.filter((c) => c.archetype && c.archetype.toLowerCase().includes(archLower));
    }
    if (filters.name) {
      const nameLower = filters.name.toLowerCase();
      cards = cards.filter((c) => c.name.toLowerCase().includes(nameLower));
    }
    cards.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    const totalCount = cards.length;
    const totalQuantity = cards.reduce((acc, c) => acc + (Number(c.quantity) || 1), 0);

    if (paginate) {
      let startIndex = 0;
      if (cursor) {
        const [createdAt, docId] = cursor.split('_');
        const foundIdx = cards.findIndex(c => (c.createdAt === createdAt && c.id === docId) || c.id === docId);
        if (foundIdx !== -1) startIndex = foundIdx + 1;
      }
      const pageDocs = cards.slice(startIndex, startIndex + limit);
      const hasMore = (startIndex + limit) < totalCount;
      const nextCursor = hasMore && pageDocs.length > 0
        ? `${pageDocs[pageDocs.length - 1].createdAt}_${pageDocs[pageDocs.length - 1].id}`
        : null;

      return { cards: pageDocs, nextCursor, hasMore, totalCount, totalQuantity };
    }

    return { cards, nextCursor: null, hasMore: false, totalCount, totalQuantity };
  }

  /**
   * Busca un documento por su ID de Firestore.
   */
  async findById(id) {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new AppError(`Carta en wishlist con ID "${id}" no encontrada.`, 404);
    }

    return { id: doc.id, ...doc.data() };
  }

  /**
   * Busca un documento por cardId (ID de la API externa) y rarity dentro del scope de un usuario.
   * Permite tener la misma carta con diferentes rarezas buscadas.
   */
  async findByCardIdAndRarity(cardId, rarity, userId) {
    let query = this.collection.where('cardId', '==', cardId);
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    if (rarity) {
      query = query.where('rarity', '==', rarity);
    }
    
    const snapshot = await query.limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  // ── CREATE ────────────────────────────────────────────────────────────────────

  async create(cardData) {
    const now = new Date().toISOString();
    const payload = {
      ...cardData,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await this.collection.add(payload);
    logger.info(`📥 Carta agregada a Wishlist en Firestore: ${docRef.id} (userId: ${cardData.userId})`);
    return { id: docRef.id, ...payload };
  }

  // ── UPDATE ────────────────────────────────────────────────────────────────────

  async update(id, updates, userId = null) {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new AppError(`Carta en wishlist con ID "${id}" no encontrada.`, 404);
    }

    // Ownership check
    if (userId && doc.data().userId !== userId) {
      throw new AppError('No tienes permiso para modificar esta carta de la wishlist.', 403);
    }

    const payload = { ...updates, updatedAt: new Date().toISOString() };
    await docRef.update(payload);

    logger.info(`✏️  Carta de wishlist actualizada en Firestore: ${id}`);
    return { id, ...doc.data(), ...payload };
  }

  // ── DELETE ────────────────────────────────────────────────────────────────────

  async delete(id, userId = null) {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new AppError(`Carta en wishlist con ID "${id}" no encontrada.`, 404);
    }

    // Ownership check
    if (userId && doc.data().userId !== userId) {
      throw new AppError('No tienes permiso para eliminar esta carta de la wishlist.', 403);
    }

    await docRef.delete();
    logger.info(`🗑️  Carta eliminada de la wishlist: ${id}`);
  }
}

module.exports = new WishlistRepository();
