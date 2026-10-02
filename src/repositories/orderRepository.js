'use strict';

const { getFirestore } = require('../config/firebase');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const COLLECTION = 'orders';

/**
 * Repositorio de pedidos — Capa de acceso a datos para la colección 'orders'.
 */
class OrderRepository {
  constructor() {
    this.db = getFirestore();
    this.collection = this.db.collection(COLLECTION);
  }

  /**
   * Crea un nuevo pedido en Firestore.
   * @param {Object} orderData 
   * @returns {Promise<Object>}
   */
  async create(orderData) {
    const docRef = await this.collection.add(orderData);
    logger.info(`📋 Pedido creado en Firestore: ${docRef.id} (#${orderData.orderNumber})`);
    return { id: docRef.id, ...orderData };
  }

  /**
   * Busca un pedido por su ID de Firestore.
   * @param {string} id 
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  /**
   * Obtiene todos los pedidos de un vendedor con filtro opcional de estado.
   * @param {string} sellerId 
   * @param {string|null} status 
   * @returns {Promise<Array>}
   */
  async findAllBySeller(sellerId, status = null) {
    let query = this.collection.where('sellerId', '==', sellerId);
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }
    const snapshot = await query.get();
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Ordenar en memoria más reciente primero
    orders.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return orders;
  }

  /**
   * Busca pedidos pendientes cuya fecha de expiración haya pasado.
   * @param {string} sellerId 
   * @returns {Promise<Array>}
   */
  async findExpiredPendingOrders(sellerId) {
    const now = new Date().toISOString();
    const snapshot = await this.collection
      .where('sellerId', '==', sellerId)
      .where('status', '==', 'pending')
      .get();

    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(order => order.expiresAt && order.expiresAt < now);
  }

  /**
   * Actualiza el estado y campos adicionales de un pedido.
   * @param {string} id 
   * @param {Object} updates 
   * @returns {Promise<Object>}
   */
  async update(id, updates) {
    const docRef = this.collection.doc(id);
    const payload = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await docRef.update(payload);
    logger.info(`🔄 Pedido ${id} actualizado: status=${updates.status || 'mismo'}`);
    return { id, ...payload };
  }

  /**
   * Verifica si un orderNumber ya existe.
   * @param {string} orderNumber 
   * @returns {Promise<boolean>}
   */
  async orderNumberExists(orderNumber) {
    const snapshot = await this.collection.where('orderNumber', '==', orderNumber).limit(1).get();
    return !snapshot.empty;
  }
}

module.exports = new OrderRepository();
