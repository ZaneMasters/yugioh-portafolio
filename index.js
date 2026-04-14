'use strict';

// Carga .env solo en desarrollo — en Cloud Functions las vars vienen del entorno
if (!process.env.K_SERVICE && !process.env.FUNCTION_NAME) {
  require('dotenv').config();
}

const app    = require('./src/app');
const logger = require('./src/utils/logger');
const { PORT } = require('./src/config/env');

// ── Detectar entorno ──────────────────────────────────────────────────────────
// K_SERVICE es inyectada por Google Cloud Run/Functions automáticamente
const isCloudFunction = !!(process.env.K_SERVICE || process.env.FUNCTION_NAME || process.env.FUNCTIONS_EMULATOR);

if (isCloudFunction) {
  // ── Modo Cloud Functions ───────────────────────────────────────────────────
  // Exporta la app Express como una Cloud Function HTTP llamada "api"
  // Firebase Hosting redirige /api/** a esta función
  const { onRequest } = require('firebase-functions/v2/https');

  exports.api = onRequest(
    {
      region: 'us-central1',
      memory: '256MiB',
      timeoutSeconds: 30,
      // Las variables de entorno se configuran con:
      // firebase functions:config:set o en Firebase Console → Functions → Configuration
    },
    app,
  );

  logger.info('☁️  Running as Cloud Function — Express app exported as "api"');
} else {
  // ── Modo servidor local ────────────────────────────────────────────────────
  const port = PORT || 3000;

  app.listen(port, () => {
    logger.info(`🚀 Yu-Gi-Oh! Inventory API running on port ${port} [${process.env.NODE_ENV || 'development'}]`);
  });

  process.on('uncaughtException', (err) => {
    logger.error('❌ Uncaught Exception:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('❌ Unhandled Rejection:', reason);
    process.exit(1);
  });
}
