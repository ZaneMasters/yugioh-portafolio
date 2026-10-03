'use strict';

const { Router } = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

const rateLimit = require('express-rate-limit');

const router = Router();

// Límite estricto para recuperación de contraseña (prevenir abusos de correos y spam)
const recoverLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos por IP cada 15 min
  message: {
    success: false,
    message: 'Demasiadas solicitudes de recuperación de contraseña. Intenta de nuevo en 15 minutos.'
  }
});

// Límite para cambio de contraseña
const changePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Demasiadas solicitudes de cambio de contraseña. Intenta de nuevo en 15 minutos.'
  }
});

// /api/v1/auth/change-password
router.post('/change-password', authMiddleware, changePasswordLimiter, authController.changePassword);

// /api/v1/auth/recover-password
router.post('/recover-password', recoverLimiter, authController.recoverPassword);

// /api/v1/auth/profile
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);

module.exports = router;
