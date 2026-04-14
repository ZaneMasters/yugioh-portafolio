'use strict';

/**
 * Clase de error personalizada que transporta:
 *  - message: descripción legible del error
 *  - statusCode: código HTTP que el handler enviará al cliente
 *  - isOperational: distingue errores de negocio (true) de bugs inesperados (false)
 */
class AppError extends Error {
  /**
   * @param {string} message - Mensaje descriptivo del error
   * @param {number} [statusCode=500] - Código HTTP (400, 401, 404, 409, 422, 500, …)
   * @param {boolean} [isOperational=true] - true = error esperado/controlado
   */
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
