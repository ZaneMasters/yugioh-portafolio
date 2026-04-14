'use strict';

const express = require('express');
const cors    = require('cors');
const requestLogger = require('./middlewares/requestLogger');
const errorHandler  = require('./middlewares/errorHandler');
const router        = require('./routes');

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
// En producción, ALLOWED_ORIGINS debe ser la URL de tu frontend en Vercel
// Ejemplo: ALLOWED_ORIGINS=https://yugioh-inventory.vercel.app
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174')
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

// ── Body parsing ──────────────────────────────────────────────────────────────
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

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada.' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
