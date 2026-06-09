'use strict';

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const requestLogger = require('./middlewares/requestLogger');
const errorHandler  = require('./middlewares/errorHandler');
const router        = require('./routes');

const app = express();

// ── Seguridad de Cabeceras (Helmet) ───────────────────────────────────────────
app.use(helmet());

// ── Rate Limiting (Prevenir DDoS y Spam) ──────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // Límite de 1000 peticiones por IP cada 15 minutos para permitir gestión fluida del inventario
  message: { success: false, message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde.' }
});
app.use(limiter);

// ── CORS ──────────────────────────────────────────────────────────────────────
// En producción, ALLOWED_ORIGINS debe ser la URL de tu frontend en Vercel o Firebase
// Ejemplo: ALLOWED_ORIGINS=https://yugioh-inventory.vercel.app
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS || 
  'http://localhost:5173,http://localhost:5174,https://yugioh-8fc03.web.app,https://yugioh-8fc03.firebaseapp.com'
)
  .split(',')
  .map((o) => o.trim())

app.use(cors({
  origin: (origin, callback) => {
    // Permite peticiones sin origin (Postman, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origen no permitido → ${origin}`))
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ── Compresión y Body parsing ──────────────────────────────────────────────────
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── HTTP request logger (Morgan) ──────────────────────────────────────────────
app.use(requestLogger);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────────────────────────
// En Cloud Functions, a veces el entorno recorta el nombre de la función ('/api')
// Montamos en ambos para máxima compatibilidad: local y cloud
app.use('/api/v1', router);
app.use('/v1', router);

const fs = require('fs');
const path = require('path');

// ── Intercepción SEO para Bots (WhatsApp, Discord, etc) ──────────────────────
app.get('/portfolio/:slug', async (req, res, next) => {
  const isBot = /bot|whatsapp|facebook|twitter|discord|telegram|linkedin/i.test(req.get('user-agent'));
  
  if (isBot) {
    const { slug } = req.params;
    const tab = req.query.tab || 'inventory';
    const title = tab === 'wishlist' ? `Wishlist de ${slug}` : `Portafolio de ${slug}`;
    const desc = tab === 'wishlist' ? 'Cartas que estoy buscando' : 'Mi colección de cartas';
    
    const host = req.get('x-forwarded-host') || req.get('host');
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const ogImageUrl = `${protocol}://${host}/api/v1/og/portfolio/${slug}.png?tab=${tab}`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <meta property="og:title" content="${title}">
        <meta property="og:description" content="${desc}">
        <meta property="og:image" content="${ogImageUrl}">
        <meta property="og:url" content="${protocol}://${host}${req.originalUrl}">
        <meta property="og:type" content="website">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:image" content="${ogImageUrl}">
      </head>
      <body></body>
      </html>
    `;
    return res.status(200).send(html);
  }

  // Si no es un bot, servimos el index.html de React
  try {
    const indexPath = path.join(__dirname, '../frontend/dist/index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    
    // Fallback para producción: Firebase Functions a veces excluye el directorio 'dist'
    // Descargamos el index.html estático de nuestro propio hosting.
    const host = req.get('x-forwarded-host') || req.get('host');
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const response = await require('axios').get(`${protocol}://${host}/index.html`);
    res.set('Content-Type', 'text/html');
    return res.status(200).send(response.data);
  } catch(e) {
    next();
  }
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada.' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
