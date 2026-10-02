import api from './api'

/**
 * Servicio de pedidos para el frontend.
 */

/**
 * Crea un pedido desde el carrito público y aparta las cartas reservándolas.
 * @param {Object} payload 
 * @param {string} payload.sellerSlug 
 * @param {string} [payload.buyerName] 
 * @param {Array<{ cardId: string, quantity: number }>} payload.items 
 */
export async function createOrder(payload) {
  const res = await api.post('/orders', payload)
  return res.data
}

/**
 * Obtiene la lista de pedidos y métricas del vendedor autenticado.
 * @param {string} [status] - 'all' | 'pending' | 'completed' | 'cancelled'
 */
export async function getOrders(status = null) {
  const params = status ? { status } : {}
  const res = await api.get('/orders', { params })
  return res.data
}

/**
 * Actualiza el estado de un pedido (completar venta o cancelar).
 * @param {string} orderId 
 * @param {'completed' | 'cancelled'} status 
 */
export async function updateOrderStatus(orderId, status) {
  const res = await api.patch(`/orders/${orderId}/status`, { status })
  return res.data
}
