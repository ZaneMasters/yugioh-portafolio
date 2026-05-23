'use strict';

const { getFirestore } = require('../config/firebase');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const COLLECTION = 'folders';

class FolderRepository {
  constructor() {
    this.db = getFirestore();
    this.collection = this.db.collection(COLLECTION);
  }

  async findAll(userId) {
    const snapshot = await this.collection.where('userId', '==', userId).get();
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async findPublicByUserId(userId) {
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .where('isPublic', '==', true)
      .get();
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async findById(id) {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      throw new AppError(`Carpeta con ID "${id}" no encontrada.`, 404);
    }
    return { id: doc.id, ...doc.data() };
  }

  async create(data) {
    const now = new Date().toISOString();
    const payload = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await this.collection.add(payload);
    logger.info(`📁 Carpeta creada en Firestore: ${docRef.id} (userId: ${data.userId})`);
    return { id: docRef.id, ...payload };
  }

  async update(id, updates, userId) {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new AppError(`Carpeta con ID "${id}" no encontrada.`, 404);
    }
    if (doc.data().userId !== userId) {
      throw new AppError('No tienes permiso para modificar esta carpeta.', 403);
    }

    const payload = { ...updates, updatedAt: new Date().toISOString() };
    await docRef.update(payload);
    logger.info(`✏️ Carpeta actualizada en Firestore: ${id}`);
    
    return { id, ...doc.data(), ...payload };
  }

  async delete(id, userId) {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new AppError(`Carpeta con ID "${id}" no encontrada.`, 404);
    }
    if (doc.data().userId !== userId) {
      throw new AppError('No tienes permiso para eliminar esta carpeta.', 403);
    }

    await docRef.delete();
    logger.info(`🗑️ Carpeta eliminada de Firestore: ${id}`);
  }
}

module.exports = new FolderRepository();
