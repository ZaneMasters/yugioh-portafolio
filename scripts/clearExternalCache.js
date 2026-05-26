'use strict';

// Carga .env para obtener las credenciales de Firebase
require('dotenv').config();

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs   = require('fs');

// Inicializar Firebase Admin
if (!getApps().length) {
  const credPath = process.env.FIREBASE_CREDENTIALS_PATH || './firebase-credentials.json';
  const absPath  = path.resolve(credPath);

  if (!fs.existsSync(absPath)) {
    console.error(`❌ No se encontró el archivo de credenciales: ${absPath}`);
    process.exit(1);
  }

  initializeApp({ credential: cert(absPath) });
}

const db = getFirestore();
const COLLECTION = 'ygo_external_cache';
const BATCH_SIZE = 500;

async function clearCache() {
  console.log(`🧹 Limpiando colección "${COLLECTION}"…`);

  let totalDeleted = 0;
  let snap;

  do {
    snap = await db.collection(COLLECTION).limit(BATCH_SIZE).get();

    if (snap.empty) break;

    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    totalDeleted += snap.docs.length;
    console.log(`   🗑️  Eliminados ${snap.docs.length} docs (total: ${totalDeleted})`);
  } while (snap.docs.length === BATCH_SIZE); // continuar si había más

  console.log(`✅ Caché limpiada. Total eliminados: ${totalDeleted} documentos.`);
  process.exit(0);
}

clearCache().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
