'use strict';

const { Router } = require('express');
const cardController = require('../controllers/cardController');
const validate = require('../middlewares/validate');
const authMiddleware = require('../middlewares/authMiddleware');
const { createCardSchema } = require('../dtos/createCardDto');
const { updateCardSchema, idParamSchema } = require('../dtos/updateCardDto');

const rateLimit = require('express-rate-limit');

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

const refreshPriceLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 60, // hasta 60 consultas cada 5 minutos por IP
  message: { success: false, message: 'Demasiadas solicitudes de actualización de precio. Intenta más tarde.' },
});

/**
 * @route   POST /api/v1/cards/public/refresh-price/:id
 * @desc    Actualizar en segundo plano el precio TCGPlayer de una carta (público / carrito)
 * @access  Public (protegido por rate-limiter)
 */
router.post(
  '/public/refresh-price/:id',
  refreshPriceLimiter,
  validate({ params: idParamSchema }),
  cardController.refreshCardPricePublic,
);

/**
 * @route   GET /api/v1/cards/search-by-set
 * @desc    Buscar cartas exclusivamente por Set Code con disponibilidad en la comunidad
 * @query   code
 * @access  Public
 */
router.get('/search-by-set', cardController.searchCardsBySet);

/**
 * @route   POST /api/v1/cards/sync-prices
 * @desc    Sincronizar precios de TCGPlayer de las cartas del usuario
 * @access  Private (requiere Firebase ID Token)
 */
router.post('/sync-prices', authMiddleware, cardController.syncPrices);

/**
 * @route   POST /api/v1/cards/:id/sync-price
 * @desc    Sincronizar el precio TCGPlayer de una sola carta bajo demanda
 * @access  Private (requiere Firebase ID Token)
 */
router.post(
  '/:id/sync-price',
  authMiddleware,
  validate({ params: idParamSchema }),
  cardController.syncSingleCardPrice,
);


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
 * @desc    Actualizar carta de inventario (solo el propietario)
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
