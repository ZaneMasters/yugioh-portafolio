'use strict';

const { Router } = require('express');
const cardController = require('../controllers/cardController');
const validate = require('../middlewares/validate');
const authMiddleware = require('../middlewares/authMiddleware');
const { createCardSchema } = require('../dtos/createCardDto');
const { updateCardSchema, idParamSchema } = require('../dtos/updateCardDto');

const router = Router();

/**
 * @route   POST /api/v1/cards
 * @desc    Registrar carta en el inventario del usuario autenticado
 * @access  Private (requiere Firebase ID Token)
 */
router.post(
  '/',
  authMiddleware,
  validate({ body: createCardSchema }),
  cardController.createCard,
);

/**
 * @route   GET /api/v1/cards
 * @desc    Listar todas las cartas del inventario del administrador autenticado
 * @query   name, type, archetype
 * @access  Private (requiere Firebase ID Token)
 */
router.get('/', authMiddleware, cardController.getAllCards);

/**
 * @route   GET /api/v1/portfolio/:slug/cards
 * @desc    Portafolio público de un usuario identificado por su email-slug
 * @example GET /api/v1/portfolio/angel/cards → cartas de angel@yugioh.com
 * @query   name, type, archetype
 * @access  Public
 */
router.get('/portfolio/:slug/cards', cardController.getPortfolioBySlug);

/**
 * @route   GET /api/v1/cards/:id
 * @desc    Obtener una carta del inventario por ID de Firestore
 * @access  Public
 */
router.get(
  '/:id',
  validate({ params: idParamSchema }),
  cardController.getCardById,
);

/**
 * @route   PUT /api/v1/cards/:id
 * @desc    Actualizar quantity y/o condition (solo el propietario)
 * @access  Private (requiere Firebase ID Token)
 */
router.put(
  '/:id',
  authMiddleware,
  validate({ params: idParamSchema, body: updateCardSchema }),
  cardController.updateCard,
);

/**
 * @route   DELETE /api/v1/cards/:id
 * @desc    Eliminar una carta del inventario (solo el propietario)
 * @access  Private (requiere Firebase ID Token)
 */
router.delete(
  '/:id',
  authMiddleware,
  validate({ params: idParamSchema }),
  cardController.deleteCard,
);

module.exports = router;
