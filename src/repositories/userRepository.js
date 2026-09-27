'use strict';

const { getFirestore } = require('../config/firebase');

const COLLECTION = 'users';

class UserRepository {
  constructor() {
    this.db = getFirestore();
    this.collection = this.db.collection(COLLECTION);
  }

  /**
   * Obtiene el perfil de un usuario por su UID.
   * @param {string} uid 
   * @returns {Promise<Object|null>}
   */
  async getProfile(uid) {
    const doc = await this.collection.doc(uid).get();
    if (!doc.exists) return null;
    return doc.data();
  }

  /**
   * Verifica si un slug ya está en uso por ALGUIEN MÁS.
   * @param {string} slug 
   * @param {string} currentUid - Para ignorar si el slug pertenece al mismo usuario
   * @returns {Promise<boolean>}
   */
  async isSlugTaken(slug, currentUid) {
    const snapshot = await this.collection
      .where('slug', '==', slug)
      .limit(1)
      .get();
      
    if (snapshot.empty) return false;
    
    // Si no está vacío, verificar si el dueño es el mismo usuario
    const doc = snapshot.docs[0];
    return doc.id !== currentUid;
  }

  /**
   * Busca el UID asociado a un slug específico.
   * @param {string} slug 
   * @returns {Promise<string|null>}
   */
  async getUidBySlug(slug) {
    const snapshot = await this.collection
      .where('slug', '==', slug)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    return snapshot.docs[0].id;
  }

  /**
   * Actualiza el perfil (incluyendo el slug y whatsapp)
   * @param {string} uid 
   * @param {string} email 
   * @param {string} slug 
   * @param {string} whatsapp 
   */
  async updateProfile(uid, email, slug, whatsapp = null) {
    const payload = {
      email,
      slug,
      updatedAt: new Date().toISOString()
    };
    if (whatsapp !== null) {
      payload.whatsapp = whatsapp;
    }
    await this.collection.doc(uid).set(payload, { merge: true });
    return payload;
  }

  /**
   * Ajusta los contadores agregados de inventario y wishlist de forma atómica.
   * @param {string} uid
   * @param {{ inventoryDelta?: number, wishlistDelta?: number }} deltas
   */
  async adjustCounters(uid, { inventoryDelta = 0, wishlistDelta = 0 }) {
    if (!uid) return;
    const { FieldValue } = require('firebase-admin/firestore');
    const updates = {};
    if (inventoryDelta !== 0) updates.inventoryCount = FieldValue.increment(inventoryDelta);
    if (wishlistDelta !== 0) updates.wishlistCount = FieldValue.increment(wishlistDelta);
    if (Object.keys(updates).length > 0) {
      await this.collection.doc(uid).set(updates, { merge: true });
    }
  }
}

module.exports = new UserRepository();
