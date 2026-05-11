'use strict';

const { Router } = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = Router();

// /api/v1/auth/change-password
router.post('/change-password', authMiddleware, authController.changePassword);

// /api/v1/auth/recover-password
router.post('/recover-password', authController.recoverPassword);

// /api/v1/auth/profile
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);

module.exports = router;
