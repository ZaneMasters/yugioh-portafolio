'use strict';

const { getFirestore } = require('../config/firebase');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const COLLECTION = 'cards';

/**
 * Repositorio de cartas — Capa de acceso a datos (Firestore).
 * No contiene lógica de negocio, solo operaciones CRUD atómicas.
 */
class CardRepository {
  constructor() {
    this.db = getFirestore();
    this.collection = this.db.collection(COLLECTION);
  }

  // ── READ ──────────────────────────────────────────────────────────────────────

  /**
   * Obtiene todos los documentos de la colección con filtros opcionales.
   * @param {{ name?: string, type?: string, archetype?: string }} filters
   * @returns {Promise<Array>}
   */
  async findAll(filters = {}) {
    let query = this.collection.orderBy('createdAt', 'desc');

    // Firestore soporta filtros de igualdad directamente
    if (filters.type) {
      query = query.where('type', '==', filters.type);
    }
    if (filters.archetype) {
      query = query.where('archetype', '==', filters.archetype);
    }

    const snapshot = await query.get();
    let cards = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Filtro de nombre (substring insensible a mayúsculas, no soportado nativamente por Firestore)
    if (filters.name) {
      const nameLower = filters.name.toLowerCase();
      cards = cards.filter((c) => c.name.toLowerCase().includes(nameLower));
    }

    return cards;
  }

  /**
   * Busca un documento por su ID de Firestore.
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async findById(id) {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new AppError(`Carta con ID "${id}" no encontrada.`, 404);
    }

    return { id: doc.id, ...doc.data() };
  }

  /**
   * Busca un documento por cardId (ID de la API externa).
   * @param {number} cardId
   * @returns {Promise<Object|null>} null si no existe
   */
  async findByCardId(cardId) {
    const snapshot = await this.collection.where('cardId', '==', cardId).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  // ── CREATE ────────────────────────────────────────────────────────────────────

  /**
   * Crea un nuevo documento en la colección.
   * @param {Object} cardData - Datos de la carta (sin id)
   * @returns {Promise<Object>} Documento creado con su id generado
   */
  async create(cardData) {
    const now = new Date().toISOString();
    const payload = {
      ...cardData,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await this.collection.add(payload);
    logger.info(`📥 Carta creada en Firestore: ${docRef.id}`);
    return { id: docRef.id, ...payload };
  }

  // ── UPDATE ────────────────────────────────────────────────────────────────────

  /**
   * Actualiza campos específicos de un documento existente.
   * @param {string} id - ID del documento en Firestore
   * @param {Object} updates - Campos a actualizar
   * @returns {Promise<Object>} Documento actualizado
   */
  async update(id, updates) {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new AppError(`Carta con ID "${id}" no encontrada.`, 404);
    }

    const payload = { ...updates, updatedAt: new Date().toISOString() };
    await docRef.update(payload);

    logger.info(`✏️  Carta actualizada en Firestore: ${id}`);
    return { id, ...doc.data(), ...payload };
  }

  // ── DELETE ────────────────────────────────────────────────────────────────────

  /**
   * Elimina un documento por su ID.
   * @param {string} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new AppError(`Carta con ID "${id}" no encontrada.`, 404);
    }

    await docRef.delete();
    logger.info(`🗑️  Carta eliminada de Firestore: ${id}`);
  }
}

module.exports = new CardRepository();
