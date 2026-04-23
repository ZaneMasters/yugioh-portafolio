/**
 * Script de migración ONE-SHOT — Agrega `userId` a todas las cartas existentes
 * que no lo tengan.
 *
 * Uso:
 *   node scripts/migrateAddUserId.js
 *
 * Prerequisito: setear OWNER_EMAIL en este archivo (o como variable de entorno)
 * con el email del administrador principal cuyas cartas existentes se migrarán.
 *
 * Ejemplo: OWNER_EMAIL=angel@yugioh.com node scripts/migrateAddUserId.js
 */

'use strict';

require('dotenv').config();
const admin = require('firebase-admin');

// ── Configurar Firebase Admin ─────────────────────────────────────────────────
const serviceAccount = require('../firebase-credentials.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ── Parámetro: email del propietario de las cartas existentes ─────────────────
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'angel@yugioh.com';

async function migrate() {
  console.log(`\n🚀 Iniciando migración multi-tenant...`);
  console.log(`📧 Buscando UID para: ${OWNER_EMAIL}\n`);

  // 1. Obtener el UID del propietario
  let ownerUid;
  try {
    const userRecord = await admin.auth().getUserByEmail(OWNER_EMAIL);
    ownerUid = userRecord.uid;
    console.log(`✅ UID encontrado: ${ownerUid}`);
  } catch (err) {
    console.error(`❌ No se encontró el usuario con email: ${OWNER_EMAIL}`);
    console.error(`   Asegúrate de que el usuario exista en Firebase Auth.`);
    process.exit(1);
  }

  // 2. Buscar todas las cartas sin `userId`
  const snapshot = await db
    .collection('cards')
    .where('userId', '==', null)
    .get()
    .catch(() => db.collection('cards').get()); // fallback si el índice no existe aún

  // Filtrar en memoria las que realmente no tienen userId
  const docsToMigrate = snapshot.docs.filter(doc => !doc.data().userId);

  if (docsToMigrate.length === 0) {
    console.log(`\n✨ No hay cartas sin userId. Nada que migrar.`);
    process.exit(0);
  }

  console.log(`\n📦 ${docsToMigrate.length} carta(s) sin userId encontradas.`);
  console.log(`   Asignando userId: ${ownerUid}\n`);

  // 3. Actualizar en batches de 500 (límite de Firestore por batch)
  const BATCH_SIZE = 500;
  let migrated = 0;

  for (let i = 0; i < docsToMigrate.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = docsToMigrate.slice(i, i + BATCH_SIZE);

    for (const doc of chunk) {
      batch.update(doc.ref, {
        userId:    ownerUid,
        updatedAt: new Date().toISOString(),
      });
    }

    await batch.commit();
    migrated += chunk.length;
    console.log(`   ✅ Batch procesado: ${migrated}/${docsToMigrate.length} cartas`);
  }

  console.log(`\n🎉 Migración completada. ${migrated} carta(s) actualizadas.`);
  console.log(`   Portafolio disponible en: /portfolio/${OWNER_EMAIL.split('@')[0]}\n`);
  process.exit(0);
}

migrate().catch((err) => {
  console.error('\n❌ Error durante la migración:', err.message);
  process.exit(1);
});
