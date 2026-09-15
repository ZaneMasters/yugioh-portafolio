'use strict';

const { Router } = require('express');
const userController = require('../controllers/userController');

const router = Router();

// GET /api/v1/users/public o /api/v1/users
router.get('/public', userController.getPublicUsers);
router.get('/', userController.getPublicUsers);

module.exports = router;
