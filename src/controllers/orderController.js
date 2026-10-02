'use strict';

const orderService = require('../services/orderService');
const logger       = require('../utils/logger');

/**
 * Controlador de pedidos.
 */
class OrderController {
  /**
   * POST /api/orders
   * Público — Crea un pedido desde el carrito y reserva las cartas.
   */
  async createOrder(req, res, next) {
    try {
      const { sellerSlug, buyerName, items } = req.body;
      const order = await orderService.createOrder({ sellerSlug, buyerName, items });
      return res.status(201).json({
        success: true,
        message: `Pedido #${order.orderNumber} registrado exitosamente. Cartas reservadas.`,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/orders
   * Privado — Obtiene los pedidos del vendedor autenticado y sus métricas.
   */
  async getOrders(req, res, next) {
    try {
      const sellerId = req.user.uid;
      const { status } = req.query;
      const data = await orderService.getOrders(sellerId, status);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/orders/:id/status
   * Privado — Cambia el estado de un pedido (completed o cancelled).
   */
  async updateOrderStatus(req, res, next) {
    try {
      const sellerId = req.user.uid;
      const { id } = req.params;
      const { status } = req.body;
      const updatedOrder = await orderService.updateOrderStatus(id, sellerId, status);
      return res.status(200).json({
        success: true,
        message: status === 'completed'
          ? `¡Venta completada! Pedido #${updatedOrder.orderNumber} procesado y descontado del inventario.`
          : `Pedido #${updatedOrder.orderNumber} cancelado y cartas devueltas a la vitrina.`,
        data: updatedOrder,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();
