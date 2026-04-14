'use strict';

const admin = require('firebase-admin');
const logger = require('../utils/logger');

/**
 * Middleware de autenticación via Firebase ID Token.
 *
 * El cliente debe enviar el token en el header:
 *   Authorization: Bearer <firebase-id-token>
 *
 * Si el token es válido, inyecta req.user con los datos del usuario.
 */
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado. Se requiere token de autenticación.',
    });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
    };
    logger.debug(`🔐 Auth OK — usuario: ${decodedToken.email}`);
    next();
  } catch (err) {
    logger.warn(`🔒 Token inválido: ${err.message}`);
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado. Vuelve a iniciar sesión.',
    });
  }
};

module.exports = authMiddleware;
