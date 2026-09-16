'use strict';

require('dotenv').config();
const admin = require('firebase-admin');
const serviceAccount = require('../firebase-credentials.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function cleanOrphanData() {
  console.log('🔍 Buscando datos huérfanos en Firestore...');

  // 1. Obtener todos los UIDs de usuarios existentes
  const usersSnap = await db.collection('users').get();
  const validUserIds = new Set(usersSnap.docs.map(d => d.id));
  console.log(`👤 Usuarios registrados válidos (${validUserIds.size}):`, Array.from(validUserIds));

  let totalDeleted = 0;
  const batch = db.batch();

  // 2. Revisar colección 'cards'
  const cardsSnap = await db.collection('cards').get();
  cardsSnap.forEach(doc => {
    const data = doc.data();
    const uid = data.userId;
    if (!uid || !validUserIds.has(uid)) {
      console.log(`🗑️ Eliminando carta huérfana: [${doc.id}] "${data.name}" (userId: ${uid || 'ninguno'})`);
      batch.delete(doc.ref);
      totalDeleted++;
    }
  });

  // 3. Revisar colección 'wishlist'
  const wishlistSnap = await db.collection('wishlist').get();
  wishlistSnap.forEach(doc => {
    const data = doc.data();
    const uid = data.userId;
    if (!uid || !validUserIds.has(uid)) {
      console.log(`🗑️ Eliminando wishlist huérfana: [${doc.id}] "${data.name}" (userId: ${uid || 'ninguno'})`);
      batch.delete(doc.ref);
      totalDeleted++;
    }
  });

  // 4. Revisar colección 'folders'
  const foldersSnap = await db.collection('folders').get();
  foldersSnap.forEach(doc => {
    const data = doc.data();
    const uid = data.userId;
    if (!uid || !validUserIds.has(uid)) {
      console.log(`🗑️ Eliminando carpeta huérfana: [${doc.id}] "${data.name}" (userId: ${uid || 'ninguno'})`);
      batch.delete(doc.ref);
      totalDeleted++;
    }
  });

  if (totalDeleted > 0) {
    await batch.commit();
    console.log(`✅ Limpieza finalizada: ${totalDeleted} documentos huérfanos eliminados con éxito.`);
  } else {
    console.log('✨ No se encontraron datos huérfanos.');
  }

  process.exit(0);
}

cleanOrphanData().catch(err => {
  console.error('❌ Error durante la limpieza:', err);
  process.exit(1);
});
