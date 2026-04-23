'use strict';

/**
 * Centraliza la lectura y validación de variables de entorno.
 * El proceso falla con un mensaje claro si falta alguna variable crítica.
 */

const required = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`❌ Variable de entorno requerida no definida: ${key}`);
  }
  return value;
};

const optional = (key, defaultValue) => process.env[key] ?? defaultValue;

module.exports = {
  PORT: optional('PORT', '3000'),
  NODE_ENV: optional('NODE_ENV', 'development'),

  // Firebase
  FIREBASE_CREDENTIALS_PATH: optional('FIREBASE_CREDENTIALS_PATH', null),
  FIREBASE_CREDENTIALS_BASE64: optional('FIREBASE_CREDENTIALS_BASE64', null),
  // En Cloud Functions, GCLOUD_PROJECT o FIREBASE_CONFIG ya traen el ID
  FIREBASE_PROJECT_ID: optional('FIREBASE_PROJECT_ID', process.env.GCLOUD_PROJECT || 'yugioh-8fc03'),
  FIREBASE_STORAGE_BUCKET: optional('FIREBASE_STORAGE_BUCKET', `${process.env.GCLOUD_PROJECT || 'yugioh-8fc03'}.firebasestorage.app`),

  // API externa
  YGO_API_BASE_URL: optional('YGO_API_BASE_URL', 'https://db.ygoprodeck.com/api/v7'),

  // Cache
  CACHE_TTL_SECONDS: parseInt(optional('CACHE_TTL_SECONDS', '300'), 10),
  CACHE_MAX_SIZE: parseInt(optional('CACHE_MAX_SIZE', '200'), 10),

  // Logger
  LOG_LEVEL: optional('LOG_LEVEL', 'info'),
};
