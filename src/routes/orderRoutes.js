'use strict';

const { Router }      = require('express');
const orderController = require('../controllers/orderController');
const authMiddleware  = require('../middlewares/authMiddleware');

const rateLimit       = require('express-rate-limit');

const router = Router();

// Límite de creación de pedidos (máximo 8 pedidos por IP cada 15 minutos)
// Previene que atacantes o scripts agoten y bloqueen el inventario de una tienda
const orderCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: {
    success: false,
    message: 'Has realizado demasiados pedidos recientemente desde esta conexión. Por favor espera unos minutos antes de intentar de nuevo.',
  },
});

// POST /api/orders — Público (Carrito de compras con protección anti-abuso)
router.post('/', orderCreateLimiter, (req, res, next) => orderController.createOrder(req, res, next));

// GET /api/orders — Privado (Admin pedidos y métricas)
router.get('/', authMiddleware, (req, res, next) => orderController.getOrders(req, res, next));

// PATCH /api/orders/:id/status — Privado (Admin confirmar venta o cancelar)
router.patch('/:id/status', authMiddleware, (req, res, next) => orderController.updateOrderStatus(req, res, next));

module.exports = router;
