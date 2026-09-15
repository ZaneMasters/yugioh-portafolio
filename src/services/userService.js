'use strict';

const { getFirestore } = require('../config/firebase');
const logger = require('../utils/logger');
const { invalidateSlugCache } = require('../utils/slugToUid');
const userRepository = require('../repositories/userRepository');

/**
 * Elimina todos los datos asociados a un usuario en Firestore.
 * Esto se ejecuta cuando el usuario es eliminado en Firebase Authentication.
 *
 * @param {string} uid - El ID del usuario en Firebase Auth
 */
async function cleanupUserData(uid) {
  const db = getFirestore();
  const batch = db.batch();
  let deletedCount = 0;

  try {
    logger.info(`🧹 Iniciando limpieza de datos para el usuario eliminado: ${uid}`);

    // 1. Obtener perfil para limpiar el cache del slug
    const profile = await userRepository.getProfile(uid);
    if (profile && profile.slug) {
      invalidateSlugCache(profile.slug);
    }
    
    // 2. Eliminar el documento del perfil de usuario
    const userRef = db.collection('users').doc(uid);
    batch.delete(userRef);
    deletedCount++;

    // Helper para buscar y agregar documentos al batch
    const deleteFromCollection = async (collectionName) => {
      const snapshot = await db.collection(collectionName).where('userId', '==', uid).get();
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
        deletedCount++;
      });
    };

    // 3. Eliminar cartas del inventario
    await deleteFromCollection('cards');

    // 4. Eliminar lista de deseos
    await deleteFromCollection('wishlist');

    // 5. Eliminar carpetas
    await deleteFromCollection('folders');

    // 6. Ejecutar el batch
    if (deletedCount > 0) {
      // Nota: Firestore permite hasta 500 operaciones por batch.
      // Si un usuario tiene más de ~490 cartas, el batch fallaría.
      // Para portafolios enormes, sería mejor iterar en chunks de 500.
      // Implementamos una partición sencilla:
      if (deletedCount <= 500) {
        await batch.commit();
        logger.info(`✅ Limpieza completada: ${deletedCount} documentos eliminados para el usuario ${uid}`);
      } else {
        // Fallback para usuarios con muchos datos (chunking)
        logger.warn(`⚠️ El usuario ${uid} tiene ${deletedCount} documentos. Limpiando sin batch...`);
        
        await db.collection('users').doc(uid).delete();
        
        const collections = ['cards', 'wishlist', 'folders'];
        for (const coll of collections) {
          const snap = await db.collection(coll).where('userId', '==', uid).get();
          const deletePromises = snap.docs.map(doc => doc.ref.delete());
          await Promise.all(deletePromises);
        }
        logger.info(`✅ Limpieza masiva completada para el usuario ${uid}`);
      }
    } else {
      logger.info(`✅ No se encontraron datos para limpiar del usuario ${uid}`);
    }
  } catch (error) {
    logger.error(`❌ Error limpiando datos del usuario ${uid}:`, error);
    // En Cloud Functions es importante relanzar el error si queremos que reintente (si está configurado)
    throw error;
  }
}

/**
 * Obtiene la lista de todos los coleccionistas públicos con estadísticas de cartas
 * @returns {Promise<Array>}
 */
async function getPublicUsers() {
  const cacheKey = 'public_users_summary';
  const memCache = require('../utils/cache');
  const cached = memCache.get(cacheKey);
  if (cached) return cached;

  const db = getFirestore();
  const usersSnap = await db.collection('users').get();

  // Traer conteo de cartas y wishlist agrupadas por userId
  const [cardsSnap, wishlistSnap] = await Promise.all([
    db.collection('cards').select('userId').get(),
    db.collection('wishlist').select('userId').get()
  ]);

  const cardsCountMap = {};
  cardsSnap.forEach((doc) => {
    const uid = doc.data().userId;
    if (uid) cardsCountMap[uid] = (cardsCountMap[uid] || 0) + 1;
  });

  const wishlistCountMap = {};
  wishlistSnap.forEach((doc) => {
    const uid = doc.data().userId;
    if (uid) wishlistCountMap[uid] = (wishlistCountMap[uid] || 0) + 1;
  });

  const users = [];
  usersSnap.forEach((doc) => {
    const data = doc.data();
    if (data.slug) {
      const inventoryCount = cardsCountMap[doc.id] || 0;
      const wishlistCount = wishlistCountMap[doc.id] || 0;
      users.push({
        slug: data.slug,
        displayName: data.slug.charAt(0).toUpperCase() + data.slug.slice(1),
        inventoryCount,
        wishlistCount,
        totalCards: inventoryCount + wishlistCount,
        hasWhatsapp: !!data.whatsapp,
        updatedAt: data.updatedAt || null,
      });
    }
  });

  // Ordenar: primero los que tienen más cartas en inventario, luego alfabético
  users.sort((a, b) => b.inventoryCount - a.inventoryCount || a.slug.localeCompare(b.slug));

  // Guardar en cache por 30 segundos para reflejar cambios rápidos en Firestore
  memCache.set(cacheKey, users, 30);

  return users;
}

module.exports = {
  cleanupUserData,
  getPublicUsers,
};

