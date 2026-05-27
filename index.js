'use strict';

// Carga .env solo en desarrollo — en Cloud Functions las vars vienen del entorno
if (!process.env.K_SERVICE && !process.env.FUNCTION_NAME) {
  require('dotenv').config();
}

const app    = require('./src/app');
const logger = require('./src/utils/logger');
const catalogService = require('./src/services/catalogService');
const { PORT } = require('./src/config/env');

// El catálogo se inicializará dinámicamente en el primer request
// para evitar que se ejecute durante la fase de análisis de Firebase Deploy.

// Exporta la app Express como una Cloud Function HTTP llamada "api"
// Firebase Hosting redirige /api/** a esta función
const { onRequest } = require('firebase-functions/v2/https');
const functions = require('firebase-functions/v1');
const { cleanupUserData } = require('./src/services/userService');

// Middleware para inicializar el catálogo en el primer request (Cold Start)
let catalogInitialized = false;
app.use((req, res, next) => {
  if (!catalogInitialized) {
    catalogInitialized = true;
    // No usamos await para no bloquear la primera petición si no es de cartas,
    // pero si necesitan cartas tendrán que esperar internamente.
    catalogService.initCatalog().catch(err => logger.error('Error initCatalog:', err));
  }
  next();
});

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

// Trigger de Auth: Limpieza automática cuando se elimina un usuario desde Firebase Console
exports.onUserDeleted = functions.region('us-central1').auth.user().onDelete(async (user) => {
  await cleanupUserData(user.uid);
});

// ── Modo servidor local ────────────────────────────────────────────────────
// Solo se inicia si el archivo se ejecuta directamente (ej. `node index.js` o `npm run dev`)
if (require.main === module) {
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
