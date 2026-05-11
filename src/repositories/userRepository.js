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
   * Actualiza el perfil (incluyendo el slug)
   * @param {string} uid 
   * @param {string} email 
   * @param {string} slug 
   */
  async updateProfile(uid, email, slug) {
    const payload = {
      email,
      slug,
      updatedAt: new Date().toISOString()
    };
    await this.collection.doc(uid).set(payload, { merge: true });
    return payload;
  }
}

module.exports = new UserRepository();
