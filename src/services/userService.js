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

  const users = await Promise.all(
    usersSnap.docs.map(async (doc) => {
      const data = doc.data();
      if (!data.slug) return null;

      let inventoryCount = data.inventoryCount;
      let wishlistCount = data.wishlistCount;

      // Si el usuario no tiene los contadores inicializados (migración bajo demanda sin downtime)
      if (typeof inventoryCount !== 'number' || typeof wishlistCount !== 'number') {
        try {
          const [invCountSnap, wishCountSnap] = await Promise.all([
            db.collection('cards').where('userId', '==', doc.id).count().get(),
            db.collection('wishlist').where('userId', '==', doc.id).count().get(),
          ]);

          inventoryCount = invCountSnap.data().count;
          wishlistCount = wishCountSnap.data().count;

          // Persistir asíncronamente en el documento de usuario para que futuras consultas no hagan aggregations
          doc.ref.set({ inventoryCount, wishlistCount }, { merge: true }).catch((err) => {
            logger.warn(`No se pudo persistir contadores en perfil de usuario ${doc.id}: ${err.message}`);
          });
        } catch (err) {
          logger.warn(`Error calculando count para usuario ${doc.id}: ${err.message}`);
          inventoryCount = inventoryCount || 0;
          wishlistCount = wishlistCount || 0;
        }
      }

      return {
        slug: data.slug,
        displayName: data.slug.charAt(0).toUpperCase() + data.slug.slice(1),
        inventoryCount: Math.max(0, inventoryCount),
        wishlistCount: Math.max(0, wishlistCount),
        totalCards: Math.max(0, inventoryCount) + Math.max(0, wishlistCount),
        hasWhatsapp: !!data.whatsapp,
        updatedAt: data.updatedAt || null,
      };
    })
  );

  const validUsers = users.filter(Boolean);

  // Ordenar: primero los que tienen más cartas en inventario, luego alfabético
  validUsers.sort((a, b) => b.inventoryCount - a.inventoryCount || a.slug.localeCompare(b.slug));

  // Guardar en cache por 3 minutos (se invalida automáticamente ante cambios en inventario/wishlist)
  memCache.set(cacheKey, validUsers, 180);

  return validUsers;
}

module.exports = {
  cleanupUserData,
  getPublicUsers,
};

