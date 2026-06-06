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
   * Obtiene documentos con filtros opcionales y paginación cursor-based.
   *
   * Estrategia:
   *  - Si hay filtros de texto (name/type): fetch all + filter en memoria (sin paginar)
   *  - Si no hay filtros de texto: paginación real con startAfter(cursor) en Firestore
   *
   * @param {{ name?: string, type?: string, archetype?: string }} filters
   * @param {string|null} userId  - UID del propietario (null = sin filtro)
   * @param {{ limit?: number, cursor?: string, paginate?: boolean }} pagination
   * @returns {Promise<{ cards: Array, nextCursor: string|null, hasMore: boolean }>}
   */
  async findAll(filters = {}, userId = null, pagination = {}) {
    const { limit = 20, cursor = null, paginate = false } = pagination;

    // Solo hacemos fetch all si hay filtros que Firestore no soporta nativamente o requieren indices compuestos
    // que el usuario probablemente no ha creado (ej. folderIds array-contains + createdAt desc).
    // Ordenar en memoria evita el error 500 (FAILED_PRECONDITION: The query requires an index).
    const requiresMemorySort = !!(filters.name || filters.archetype || filters.folderId || filters.type);

    if (!paginate || requiresMemorySort) {
      // ── Comportamiento con filtrado en memoria ────────────────────────────────
      let query = this.collection;
      if (userId) query = query.where('userId', '==', userId);

      // Aplicar filtros nativos primero para traer menos documentos a memoria
      if (filters.folderId) query = query.where('folderIds', 'array-contains', filters.folderId);

      const snapshot = await query.get();
      let cards = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
          
          // Ampliar "Effect Monster" para incluir subtipos que no tienen la palabra "effect" en la API
          if (typeLower === 'effect monster') {
            const effectSubtypes = ['gemini', 'spirit', 'toon', 'flip monster', 'tuner monster'];
            return effectSubtypes.some(sub => cTypeLower.includes(sub));
          }
          return false;
        });
      }

      cards.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      return { cards, nextCursor: null, hasMore: false, totalCount: cards.length };
    }

    // ── Paginación real con cursor ───────────────────────────────────────────
    let query = this.collection;
    if (userId) query = query.where('userId', '==', userId);

    // Filtros Nativos
    if (filters.folderId) query = query.where('folderIds', 'array-contains', filters.folderId);

    // Ejecutar count y query en paralelo — son independientes entre si
    let countQuery = query;
    query = query.orderBy('createdAt', 'desc');
    if (cursor) query = query.startAfter(cursor);
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
    const nextCursor = hasMore ? pageDocs[pageDocs.length - 1].data().createdAt : null;

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
