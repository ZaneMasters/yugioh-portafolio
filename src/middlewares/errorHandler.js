'use strict';

const logger = require('../utils/logger');

/**
 * Middleware global de manejo de errores de Express.
 * Captura todos los errores pasados con next(err).
 *
 * Distingue entre:
 *  - AppError (errores operacionales / de negocio) → respuesta con su statusCode
 *  - Errores de Firestore / Axios → se normalizan
 *  - Errores inesperados (bugs)  → 500 Internal Server Error
 */
const errorHandler = (err, _req, res, _next) => {
  // ── Errores de validación de Zod ─────────────────────────────────────────────
  if (err.name === 'ZodError') {
    logger.warn('Validation error', { issues: err.issues });
    return res.status(422).json({
      success: false,
      message: 'Error de validación',
      errors: err.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  // ── Errores de Firebase ───────────────────────────────────────────────────────
  if (err.code && typeof err.code === 'string' && err.code.startsWith('firestore/')) {
    logger.error('Firestore error', { code: err.code, message: err.message });
    return res.status(503).json({
      success: false,
      message: 'Error en la base de datos. Intente nuevamente.',
    });
  }

  // ── Errores de Axios (API externa) ────────────────────────────────────────────
  if (err.isAxiosError) {
    const status = err.response?.status;
    logger.warn(`Axios error [${status}]: ${err.message}`);

    if (status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Carta no encontrada en la API externa de Yu-Gi-Oh!',
      });
    }
    if (status === 429) {
      return res.status(429).json({
        success: false,
        message: 'Límite de peticiones a la API externa excedido. Intente en unos momentos.',
      });
    }
    return res.status(502).json({
      success: false,
      message: 'Error al comunicarse con la API externa de Yu-Gi-Oh!',
    });
  }

  // ── AppError (errores operacionales controlados) ──────────────────────────────
  if (err.name === 'AppError' && err.isOperational) {
    logger.warn(`AppError [${err.statusCode}]: ${err.message}`);
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // ── Error inesperado (bug) ────────────────────────────────────────────────────
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  return res.status(500).json({
    success: false,
    message: 'Error interno del servidor.',
  });
};

module.exports = errorHandler;
