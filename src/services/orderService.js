'use strict';

const orderRepository   = require('../repositories/orderRepository');
const cardRepository    = require('../repositories/cardRepository');
const folderRepository  = require('../repositories/folderRepository');
const userRepository    = require('../repositories/userRepository');
const { slugToUid }     = require('../utils/slugToUid');
const AppError          = require('../utils/AppError');
const logger            = require('../utils/logger');
const memCache          = require('../utils/cache');

const INVENTORY_CACHE_PREFIX = 'inventory:';

function invalidateSellerCache(sellerId) {
  const prefix = `${INVENTORY_CACHE_PREFIX}${sellerId || 'global'}:`;
  for (const key of memCache.store.keys()) {
    if (key.startsWith(prefix)) {
      memCache.delete(key);
    }
  }
  memCache.delete('public_users_summary');
  logger.debug(`🗑️ Inventory cache invalidated for seller: ${sellerId}`);
}

/**
 * Genera un código de pedido corto y único tipo YG-XXXX (ej: YG-4821)
 */
async function generateOrderNumber() {
  for (let i = 0; i < 10; i++) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const candidate = `YG-${randomDigits}`;
    const exists = await orderRepository.orderNumberExists(candidate);
    if (!exists) return candidate;
  }
  return `YG-${Date.now().toString().slice(-6)}`;
}

class OrderService {
  /**
   * Crea un nuevo pedido desde el carrito público y aparta las cartas reservándolas.
   * @param {Object} data 
   * @param {string} data.sellerSlug 
   * @param {string} [data.buyerName] 
   * @param {Array<{ cardId: string, quantity: number }>} data.items 
   */
  async createOrder({ sellerSlug, buyerName = null, items = [] }) {
    if (!sellerSlug) {
      throw new AppError('El identificador del vendedor es requerido.', 400);
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError('El pedido debe incluir al menos una carta.', 400);
    }
    if (items.length > 25) {
      throw new AppError('Un pedido no puede contener más de 25 cartas distintas simultáneamente.', 400);
    }

    const sellerId = await slugToUid(sellerSlug);
    if (!sellerId) {
      throw new AppError(`Vendedor "${sellerSlug}" no encontrado.`, 404);
    }

    // Consolidar cantidades en caso de que el cliente envíe IDs repetidos
    const consolidatedMap = new Map();
    for (const it of items) {
      if (!it.cardId || typeof it.cardId !== 'string') {
        throw new AppError('ID de carta inválido en el pedido.', 400);
      }
      const qty = Math.max(1, Math.min(100, Number(it.quantity) || 1));
      consolidatedMap.set(it.cardId, (consolidatedMap.get(it.cardId) || 0) + qty);
    }
    const sanitizedItems = Array.from(consolidatedMap.entries()).map(([cardId, quantity]) => ({ cardId, quantity }));

    // Obtener horas de expiración configuradas en el perfil del vendedor (por defecto 48)
    const profile = await userRepository.getProfile(sellerId);
    const reservationHours = profile?.reservationHoursLimit ? Number(profile.reservationHoursLimit) : 48;

    // Verificar pedidos expirados del vendedor antes de procesar para liberar stock antiguo
    await this.expireOutdatedOrders(sellerId);

    const { getFirestore } = require('../config/firebase');
    const db = getFirestore();
    const orderNumber = await generateOrderNumber();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + reservationHours * 3600 * 1000).toISOString();

    // ── Transacción atómica en Firestore: lectura y bloqueo de stock seguro ──
    const newOrder = await db.runTransaction(async (transaction) => {
      const cardRefs = sanitizedItems.map(item => db.collection('cards').doc(item.cardId));
      const cardSnapshots = await Promise.all(cardRefs.map(ref => transaction.get(ref)));

      const orderItems = [];
      let totalAmount = 0;

      // 1. Fase de Validación de Lectura dentro de la transacción
      for (let i = 0; i < sanitizedItems.length; i++) {
        const doc = cardSnapshots[i];
        const reqItem = sanitizedItems[i];

        if (!doc.exists) {
          throw new AppError(`Una de las cartas seleccionadas ya no existe en el catálogo.`, 404);
        }

        const card = doc.data();
        if (card.userId !== sellerId) {
          throw new AppError(`La carta "${card.name}" no pertenece a este vendedor.`, 403);
        }

        const totalQty = Number(card.quantity) || 1;
        const reservedQty = Number(card.reservedQuantity) || 0;
        const availableQty = Math.max(0, totalQty - reservedQty);

        if (availableQty < reqItem.quantity) {
          throw new AppError(
            `Stock insuficiente para "${card.name}". Solo quedan ${availableQty} disponible(s) (solicitadas: ${reqItem.quantity}).`,
            400
          );
        }

        const priceVal = card.tcgMarketPrice ?? (card.tcgPrice && card.tcgPrice !== '0.00' && card.tcgPrice !== '0' ? card.tcgPrice : 0);
        const unitPrice = Number(priceVal) || 0;
        const subtotal = unitPrice * reqItem.quantity;
        totalAmount += subtotal;

        const folderIds = Array.isArray(card.folderIds) ? card.folderIds : [];

        orderItems.push({
          cardId: doc.id,
          name: card.name,
          setCode: card.setCode || null,
          setName: card.setName || null,
          rarity: card.rarity || null,
          edition: card.edition || null,
          image: card.imageSmall || card.image,
          unitPrice,
          quantity: reqItem.quantity,
          subtotal: Number(subtotal.toFixed(2)),
          currentReserved: reservedQty,
          folderIds,
        });
      }

      // 2. Fase de Escritura atómica (apartar stock e insertar orden)
      for (let i = 0; i < orderItems.length; i++) {
        const item = orderItems[i];
        transaction.update(cardRefs[i], {
          reservedQuantity: item.currentReserved + item.quantity,
          updatedAt: now.toISOString(),
        });
        delete item.currentReserved;
      }

      const orderRef = db.collection('orders').doc();
      const orderPayload = {
        orderNumber,
        sellerId,
        buyerName: buyerName ? buyerName.trim() : null,
        items: orderItems,
        totalAmount: Number(totalAmount.toFixed(2)),
        status: 'pending',
        createdAt: now.toISOString(),
        expiresAt,
        completedAt: null,
        cancelledAt: null,
      };

      transaction.set(orderRef, orderPayload);

      return { id: orderRef.id, ...orderPayload };
    });

    invalidateSellerCache(sellerId);
    logger.info(`✅ Pedido ${orderNumber} registrado exitosamente para vendedor ${sellerId} con reserva por ${reservationHours}h`);
    return newOrder;
  }

  /**
   * Revisa pedidos pendientes del vendedor y expira aquellos cuyo plazo haya vencido,
   * liberando el stock reservado de las cartas.
   * @param {string} sellerId 
   */
  async expireOutdatedOrders(sellerId) {
    try {
      const expiredOrders = await orderRepository.findExpiredPendingOrders(sellerId);
      if (expiredOrders.length === 0) return;

      logger.info(`⏰ Expirando ${expiredOrders.length} pedido(s) pendientes para vendedor ${sellerId}...`);

      for (const order of expiredOrders) {
        // Liberar reservedQuantity de cada carta
        for (const item of order.items) {
          try {
            const card = await cardRepository.findById(item.cardId);
            if (card) {
              const currentReserved = Number(card.reservedQuantity) || 0;
              const newReserved = Math.max(0, currentReserved - (item.quantity || 1));
              await cardRepository.update(item.cardId, { reservedQuantity: newReserved }, sellerId);
            }
          } catch (err) {
            logger.warn(`Error al liberar stock de carta ${item.cardId} para pedido expirado ${order.id}: ${err.message}`);
          }
        }

        // Marcar pedido como expirado
        await orderRepository.update(order.id, {
          status: 'expired',
          cancelledAt: new Date().toISOString(),
        });
      }

      invalidateSellerCache(sellerId);
    } catch (error) {
      logger.error(`Error en expireOutdatedOrders para ${sellerId}:`, error);
    }
  }

  /**
   * Obtiene la lista de pedidos de un vendedor con métricas acumuladas.
   * @param {string} sellerId 
   * @param {string|null} status 
   */
  async getOrders(sellerId, status = null) {
    // 1. Limpieza de reservas expiradas
    await this.expireOutdatedOrders(sellerId);

    // 2. Obtener pedidos
    const orders = await orderRepository.findAllBySeller(sellerId, status);

    // 2.1 Enriquecer items de pedidos con los nombres de las carpetas / colecciones
    try {
      const userFolders = await folderRepository.findAll(sellerId);
      const folderMap = new Map(userFolders.map(f => [f.id, f.name]));

      // Si hay órdenes antiguas sin folderIds en el snapshot, buscar en la colección cards
      const missingCardIds = [];
      for (const order of orders) {
        for (const item of (order.items || [])) {
          if (!item.folderIds && item.cardId) {
            missingCardIds.push(item.cardId);
          }
        }
      }

      const cardFolderMap = new Map();
      if (missingCardIds.length > 0) {
        const uniqueIds = [...new Set(missingCardIds)];
        const { getFirestore } = require('../config/firebase');
        const db = getFirestore();
        for (let i = 0; i < uniqueIds.length; i += 30) {
          const chunk = uniqueIds.slice(i, i + 30);
          const refs = chunk.map(id => db.collection('cards').doc(id));
          const snaps = await db.getAll(...refs);
          snaps.forEach(snap => {
            if (snap.exists) {
              const data = snap.data();
              if (Array.isArray(data.folderIds)) {
                cardFolderMap.set(snap.id, data.folderIds);
              }
            }
          });
        }
      }

      for (const order of orders) {
        for (const item of (order.items || [])) {
          const itemFolderIds = item.folderIds || cardFolderMap.get(item.cardId) || [];
          item.folderNames = itemFolderIds
            .map(fId => folderMap.get(fId))
            .filter(Boolean);
        }
      }
    } catch (err) {
      logger.warn(`Error al resolver carpetas para pedidos: ${err.message}`);
    }

    // 3. Calcular métricas para el admin
    const allOrders = status && status !== 'all'
      ? await orderRepository.findAllBySeller(sellerId, null)
      : orders;

    const metrics = {
      pendingCount: allOrders.filter(o => o.status === 'pending').length,
      completedCount: allOrders.filter(o => o.status === 'completed').length,
      totalSalesAmount: allOrders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0),
      totalSoldCards: allOrders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.items.reduce((acc, i) => acc + (i.quantity || 1), 0), 0),
    };

    return { orders, metrics };
  }

  /**
   * Cambia el estado de un pedido (completar venta o cancelar/liberar).
   * @param {string} orderId 
   * @param {string} sellerId 
   * @param {'completed' | 'cancelled'} newStatus 
   */
  async updateOrderStatus(orderId, sellerId, newStatus) {
    if (!['completed', 'cancelled'].includes(newStatus)) {
      throw new AppError('Estado no válido. Solo se permite "completed" o "cancelled".', 400);
    }

    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError('Pedido no encontrado.', 404);
    }

    if (order.sellerId !== sellerId) {
      throw new AppError('No tienes permiso para gestionar este pedido.', 403);
    }

    if (order.status !== 'pending') {
      throw new AppError(`El pedido ya fue procesado con estado: "${order.status}".`, 400);
    }

    const now = new Date().toISOString();

    if (newStatus === 'completed') {
      // ── COMPLETAR VENTA: Descontar stock definitivamente ──
      for (const item of order.items) {
        try {
          const card = await cardRepository.findById(item.cardId);
          if (card) {
            const currentTotal = Number(card.quantity) || 1;
            const currentReserved = Number(card.reservedQuantity) || 0;
            const newTotal = currentTotal - item.quantity;
            const newReserved = Math.max(0, currentReserved - item.quantity);

            if (newTotal <= 0) {
              // Se vendieron todas las copias: eliminar del inventario activo
              await cardRepository.delete(item.cardId, sellerId);
              await userRepository.adjustCounters(sellerId, { inventoryDelta: -1 });
              logger.info(`📦 Carta ${item.name} (${item.cardId}) vendida por completo y removida del inventario activo.`);
            } else {
              // Aún quedan copias: actualizar cantidad y reserva
              await cardRepository.update(item.cardId, {
                quantity: newTotal,
                reservedQuantity: newReserved,
              }, sellerId);
            }
          }
        } catch (err) {
          logger.warn(`Error al actualizar inventario en venta para carta ${item.cardId}: ${err.message}`);
        }
      }

      const updated = await orderRepository.update(orderId, {
        status: 'completed',
        completedAt: now,
      });

      invalidateSellerCache(sellerId);
      logger.info(`🎉 Venta completada para pedido ${order.orderNumber}`);
      return updated;
    }

    if (newStatus === 'cancelled') {
      // ── CANCELAR PEDIDO: Devolver reservedQuantity al inventario disponible ──
      for (const item of order.items) {
        try {
          const card = await cardRepository.findById(item.cardId);
          if (card) {
            const currentReserved = Number(card.reservedQuantity) || 0;
            const newReserved = Math.max(0, currentReserved - item.quantity);
            await cardRepository.update(item.cardId, {
              reservedQuantity: newReserved,
            }, sellerId);
          }
        } catch (err) {
          logger.warn(`Error al liberar stock en cancelación para carta ${item.cardId}: ${err.message}`);
        }
      }

      const updated = await orderRepository.update(orderId, {
        status: 'cancelled',
        cancelledAt: now,
      });

      invalidateSellerCache(sellerId);
      logger.info(`❌ Pedido ${order.orderNumber} cancelado y cartas liberadas.`);
      return updated;
    }
  }
}

module.exports = new OrderService();
