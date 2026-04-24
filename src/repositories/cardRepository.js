'use strict';

const { getFirestore } = require('../config/firebase');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const COLLECTION = 'cards';

/**
 * Repositorio de cartas — Capa de acceso a datos (Firestore).
 * No contiene lógica de negocio, solo operaciones CRUD atómicas.
 *
 * Multi-tenant: todos los métodos de lectura/escritura aceptan `userId`
 * para aislar las cartas por propietario.
 */
class CardRepository {
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
   * @param {string|null} userId - UID de Firebase del propietario (null = sin filtro)
   * @returns {Promise<Array>}
   */
  async findAll(filters = {}, userId = null) {
    // ⚠️ No usamos orderBy en Firestore para evitar requerir índices compuestos
    // al combinarlo con where(). El ordenamiento se aplica en memoria al final.
    let query = this.collection;

    // Filtro multi-tenant — scope por propietario
    if (userId) {
      query = query.where('userId', '==', userId);
    }

    // Filtro de archetype — igualdad exacta (Firestore)
    if (filters.archetype) {
      query = query.where('archetype', '==', filters.archetype);
    }

    // NOTA: el filtro de `type` se aplica en memoria (abajo) porque YGOProdeck
    // devuelve múltiples subtipos para Pendulum ('Pendulum Effect Monster',
    // 'Pendulum Normal Monster', etc.) y Ritual ('Ritual Monster', 'Ritual Effect Monster').
    // Firestore solo soporta igualdad exacta, así que filtramos con includes().

    const snapshot = await query.get();
    let cards = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Filtro de tipo (substring insensible a mayúsculas — cubre todos los subtipos)
    if (filters.type) {
      const typeLower = filters.type.toLowerCase();
      cards = cards.filter((c) => c.type && c.type.toLowerCase().includes(typeLower));
    }

    // Filtro de nombre (substring insensible a mayúsculas)
    if (filters.name) {
      const nameLower = filters.name.toLowerCase();
      cards = cards.filter((c) => c.name.toLowerCase().includes(nameLower));
    }

    // Ordenar por fecha de creación descendente (en memoria)
    cards.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

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
   * Busca un documento por cardId (ID de la API externa) dentro del scope de un usuario.
   * @param {number} cardId
   * @param {string} userId - UID del propietario
   * @returns {Promise<Object|null>} null si no existe
   */
  async findByCardId(cardId, userId) {
    let query = this.collection.where('cardId', '==', cardId);
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    const snapshot = await query.limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  // ── CREATE ────────────────────────────────────────────────────────────────────

  /**
   * Crea un nuevo documento en la colección.
   * @param {Object} cardData - Datos de la carta (sin id); debe incluir `userId`
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
    logger.info(`📥 Carta creada en Firestore: ${docRef.id} (userId: ${cardData.userId})`);
    return { id: docRef.id, ...payload };
  }

  // ── UPDATE ────────────────────────────────────────────────────────────────────

  /**
   * Actualiza campos específicos de un documento existente.
   * Verifica que la carta pertenezca al `userId` indicado antes de actualizar.
   *
   * @param {string} id - ID del documento en Firestore
   * @param {Object} updates - Campos a actualizar
   * @param {string|null} userId - UID del propietario para validar ownership (null = sin validación)
   * @returns {Promise<Object>} Documento actualizado
   */
  async update(id, updates, userId = null) {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new AppError(`Carta con ID "${id}" no encontrada.`, 404);
    }

    // Ownership check
    if (userId && doc.data().userId !== userId) {
      throw new AppError('No tienes permiso para modificar esta carta.', 403);
    }

    const payload = { ...updates, updatedAt: new Date().toISOString() };
    await docRef.update(payload);

    logger.info(`✏️  Carta actualizada en Firestore: ${id}`);
    return { id, ...doc.data(), ...payload };
  }

  // ── DELETE ────────────────────────────────────────────────────────────────────

  /**
   * Elimina un documento por su ID.
   * Verifica que la carta pertenezca al `userId` indicado antes de eliminar.
   *
   * @param {string} id
   * @param {string|null} userId - UID del propietario para validar ownership (null = sin validación)
   * @returns {Promise<void>}
   */
  async delete(id, userId = null) {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new AppError(`Carta con ID "${id}" no encontrada.`, 404);
    }

    // Ownership check
    if (userId && doc.data().userId !== userId) {
      throw new AppError('No tienes permiso para eliminar esta carta.', 403);
    }

    await docRef.delete();
    logger.info(`🗑️  Carta eliminada de Firestore: ${id}`);
  }
}

module.exports = new CardRepository();
