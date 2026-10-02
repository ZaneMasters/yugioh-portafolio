'use strict';

const { Router }      = require('express');
const orderController = require('../controllers/orderController');
const authMiddleware  = require('../middlewares/authMiddleware');

const router = Router();

// POST /api/orders — Público (Carrito de compras)
router.post('/', (req, res, next) => orderController.createOrder(req, res, next));

// GET /api/orders — Privado (Admin pedidos y métricas)
router.get('/', authMiddleware, (req, res, next) => orderController.getOrders(req, res, next));

// PATCH /api/orders/:id/status — Privado (Admin confirmar venta o cancelar)
router.patch('/:id/status', authMiddleware, (req, res, next) => orderController.updateOrderStatus(req, res, next));

module.exports = router;
