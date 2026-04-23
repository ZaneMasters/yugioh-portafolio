'use strict';

const admin = require('firebase-admin');
const path = require('path');
const logger = require('../utils/logger');
const {
  FIREBASE_CREDENTIALS_PATH,
  FIREBASE_CREDENTIALS_BASE64,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
} = require('./env');

let db;
let bucket;

/**
 * Inicializa Firebase Admin SDK y retorna la instancia de Firestore.
 * Soporta credenciales por archivo JSON o por string Base64 (ideal para producción/CI).
 */
function initFirebase() {
  if (admin.apps.length > 0) {
    db = admin.firestore();
    return db;
  }

  let credential;

  if (FIREBASE_CREDENTIALS_BASE64) {
    // Credenciales codificadas en Base64 (útil en variables de entorno de servidores CI/CD)
    const json = Buffer.from(FIREBASE_CREDENTIALS_BASE64, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(json);
    credential = admin.credential.cert(serviceAccount);
    logger.info('🔑 Firebase inicializado con credenciales Base64');
  } else if (FIREBASE_CREDENTIALS_PATH) {
    // Credenciales desde archivo JSON local
    const absolutePath = path.resolve(process.cwd(), FIREBASE_CREDENTIALS_PATH);
    const serviceAccount = require(absolutePath);
    credential = admin.credential.cert(serviceAccount);
    logger.info(`🔑 Firebase inicializado con archivo: ${absolutePath}`);
  } else {
    // Application Default Credentials (ADC) — útil cuando se despliega en Google Cloud
    credential = admin.credential.applicationDefault();
    logger.info('🔑 Firebase inicializado con Application Default Credentials (ADC)');
  }

  const appConfig = { credential, projectId: FIREBASE_PROJECT_ID };
  if (FIREBASE_STORAGE_BUCKET) {
    appConfig.storageBucket = FIREBASE_STORAGE_BUCKET;
  }
  admin.initializeApp(appConfig);

  db = admin.firestore();
  bucket = FIREBASE_STORAGE_BUCKET ? admin.storage().bucket() : null;
  logger.info(`✅ Firestore conectado al proyecto: ${FIREBASE_PROJECT_ID}`);
  if (bucket) logger.info(`🪣 Firebase Storage listo: ${FIREBASE_STORAGE_BUCKET}`);
  return db;
}

/**
 * Retorna la instancia de Firestore (la inicializa si aún no existe).
 */
function getFirestore() {
  if (!db) initFirebase();
  return db;
}

/**
 * Retorna el bucket de Firebase Storage (null si no está configurado).
 */
function getStorage() {
  if (!bucket && FIREBASE_STORAGE_BUCKET) initFirebase();
  return bucket;
}

// Inicializar al requerir el módulo
initFirebase();

module.exports = { getFirestore, getStorage };
