'use strict';

const cardService = require('../services/cardService');
const logger = require('../utils/logger');

/**
 * Controller de inventario — Capa de presentación.
 * Traduce peticiones HTTP a llamadas de servicio y envía respuestas JSON.
 * No contiene lógica de negocio.
 */

// ── POST /cards ────────────────────────────────────────────────────────────────
const createCard = async (req, res, next) => {
  try {
    const { card, created } = await cardService.registerCard(req.body);

    const statusCode = created ? 201 : 200;
    const message = created
      ? 'Carta registrada en el inventario correctamente.'
      : `Carta ya existente. Cantidad actualizada a ${card.quantity}.`;

    return res.status(statusCode).json({
      success: true,
      message,
      data: card,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /cards ─────────────────────────────────────────────────────────────────
const getAllCards = async (req, res, next) => {
  try {
    const { name, type, archetype } = req.query;
    const filters = {};
    if (name)      filters.name      = name;
    if (type)      filters.type      = type;
    if (archetype) filters.archetype = archetype;

    const cards = await cardService.listCards(filters);

    // 2 min de caché en browser/CDN — coincide con el TTL del servidor
    res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=30');

    return res.status(200).json({
      success: true,
      count: cards.length,
      data: cards,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /cards/:id ─────────────────────────────────────────────────────────────
const getCardById = async (req, res, next) => {
  try {
    const card = await cardService.getCardById(req.params.id);
    return res.status(200).json({ success: true, data: card });
  } catch (err) {
    next(err);
  }
};

// ── PUT /cards/:id ─────────────────────────────────────────────────────────────
const updateCard = async (req, res, next) => {
  try {
    const card = await cardService.updateCard(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Carta actualizada correctamente.',
      data: card,
    });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /cards/:id ──────────────────────────────────────────────────────────
const deleteCard = async (req, res, next) => {
  try {
    await cardService.deleteCard(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Carta eliminada del inventario.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createCard, getAllCards, getCardById, updateCard, deleteCard };
