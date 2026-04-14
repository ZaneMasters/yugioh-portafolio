'use strict';

const { Router } = require('express');
const externalController = require('../controllers/externalController');

const router = Router();

/**
 * @route   GET /api/v1/external/cards?name=xxx
 * @desc    Buscar cartas en la API externa de YGOProdeck por nombre parcial
 * @access  Public
 */
router.get('/cards', externalController.searchCards);

/**
 * @route   GET /api/v1/external/cards/:id
 * @desc    Obtener carta específica de la API externa por su ID numérico
 * @access  Public
 */
router.get('/cards/:id', externalController.getExternalCardById);

module.exports = router;
