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
   * Obtiene todos los documentos de la colección con filtros opcionales.
   * Si se pasa `userId`, filtra solo las cartas de ese usuario.
   *
   * @param {{ name?: string, type?: string, archetype?: string }} filters
   * @param {string|null} userId - UID de Firebase del propietario
   * @returns {Promise<Array>}
   */
  async findAll(filters = {}, userId = null) {
    let query = this.collection;

    if (userId) {
      query = query.where('userId', '==', userId);
    }

    if (filters.archetype) {
      query = query.where('archetype', '==', filters.archetype);
    }

    const snapshot = await query.get();
    let cards = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Filtro de tipo (substring insensible a mayúsculas)
    if (filters.type) {
      const typeLower = filters.type.toLowerCase();
      cards = cards.filter((c) => c.type && c.type.toLowerCase().includes(typeLower));
    }

    // Filtro de nombre (substring insensible a mayúsculas)
    if (filters.name) {
      const nameLower = filters.name.toLowerCase();
      cards = cards.filter((c) => c.name.toLowerCase().includes(nameLower));
    }

    // Ordenar por fecha de creación descendente
    cards.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return cards;
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
