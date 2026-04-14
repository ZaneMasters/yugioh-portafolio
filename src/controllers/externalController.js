'use strict';

const ygoService = require('../services/ygoService');

/**
 * Controller de API externa — Proxy simplificado a YGOProdeck.
 * Aplica Cache-Control para que el navegador/CDN también cachee las respuestas.
 */

// TTL en segundos para las cabeceras HTTP
const SEARCH_CACHE_TTL = 5 * 60;   // 5 min — búsquedas pueden variar
const CARD_CACHE_TTL   = 60 * 60;  // 1 hora — una carta no cambia frecuentemente

// ── GET /external/cards?name=xxx ───────────────────────────────────────────────
const searchCards = async (req, res, next) => {
  try {
    const { name } = req.query;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro "name" es requerido.',
      });
    }

    const cards = await ygoService.searchByName(name.trim());

    // Permite que el browser y CDN cacheen la búsqueda por 5 min
    res.set('Cache-Control', `public, max-age=${SEARCH_CACHE_TTL}, stale-while-revalidate=60`);

    return res.status(200).json({
      success: true,
      count: cards.length,
      data: cards,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /external/cards/:id ────────────────────────────────────────────────────
const getExternalCardById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'El ID debe ser un número entero positivo.',
      });
    }

    const card = await ygoService.getByCardId(id);

    // Una carta específica casi nunca cambia — 1 hora de caché en cliente
    res.set('Cache-Control', `public, max-age=${CARD_CACHE_TTL}, stale-while-revalidate=300`);

    return res.status(200).json({ success: true, data: card });
  } catch (err) {
    next(err);
  }
};

module.exports = { searchCards, getExternalCardById };
