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
   * Obtiene TODAS las cartas de un usuario sin filtros ni ordenamiento.
   * Útil para almacenar en caché y filtrar en memoria superior.
   * @param {string|null} userId
   */
  async findAllRaw(userId = null) {
    let query = this.collection;
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Obtiene documentos con filtros nativos y paginación cursor-based.
   * Únicamente realiza la paginación a nivel de base de datos.
   *
   * @param {{ folderId?: string }} filters
   * @param {string|null} userId
   * @param {{ limit?: number, cursor?: string }} pagination
   * @returns {Promise<{ cards: Array, nextCursor: string|null, hasMore: boolean, totalCount: number }>}
   */
  async findAll(filters = {}, userId = null, pagination = {}) {
    const { limit = 20, cursor = null } = pagination;

    // ── Paginación real con cursor ───────────────────────────────────────────
    let query = this.collection;
    if (userId) query = query.where('userId', '==', userId);

    // Filtros Nativos
    if (filters.folderId) query = query.where('folderIds', 'array-contains', filters.folderId);

    // Ejecutar count y query en paralelo — son independientes entre si
    let countQuery = query;
    query = query.orderBy('createdAt', 'desc').orderBy(this.db.collection(COLLECTION).firestore.constructor.FieldPath.documentId(), 'desc');
    
    if (cursor) {
      const [createdAt, docId] = cursor.split('_');
      if (createdAt && docId) {
        query = query.startAfter(createdAt, docId);
      } else {
        query = query.startAfter(cursor);
      }
    }
    query = query.limit(limit + 1);

    const [countSnapshot, snapshot] = await Promise.all([
      countQuery.count().get(),
      query.get(),
    ]);

    const totalCount = countSnapshot.data().count;
    const docs = snapshot.docs;
    const hasMore = docs.length > limit;
    const pageDocs = hasMore ? docs.slice(0, limit) : docs;

    const cards = pageDocs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const nextCursor = hasMore ? `${pageDocs[pageDocs.length - 1].data().createdAt}_${pageDocs[pageDocs.length - 1].id}` : null;

    return { cards, nextCursor, hasMore, totalCount };
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
   * Busca un documento duplicado exacto dentro del scope de un usuario.
   * Considera duplicado si tiene el mismo cardId y los mismos atributos físicos.
   * @param {number} cardId
   * @param {string} userId - UID del propietario
   * @param {Object} attrs - Atributos físicos
   * @returns {Promise<Object|null>} null si no existe
   */
  async findExactDuplicate(cardId, userId, attrs = {}) {
    let query = this.collection.where('cardId', '==', cardId);
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    
    const snapshot = await query.get();
    if (snapshot.empty) return null;
    
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filtrar en memoria por coincidencia exacta física
    const exactMatch = docs.find(c => 
      c.setCode === (attrs.setCode ?? null) &&
      c.rarity === (attrs.rarity ?? null) &&
      c.edition === (attrs.edition ?? null) &&
      c.language === (attrs.language ?? null) &&
      c.condition === (attrs.condition ?? 'new')
    );

    return exactMatch || null;
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
