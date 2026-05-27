'use strict';

const cardService  = require('../services/cardService');
const folderService = require('../services/folderService');
const { slugToUid } = require('../utils/slugToUid');
const AppError     = require('../utils/AppError');
const logger       = require('../utils/logger');

/**
 * Controller de inventario — Capa de presentación.
 * Traduce peticiones HTTP a llamadas de servicio y envía respuestas JSON.
 * No contiene lógica de negocio.
 *
 * Multi-tenant: las operaciones de escritura usan req.user.uid (autenticado).
 * La lectura pública de portafolio usa el slug del path para resolver el UID.
 */

// ── POST /cards ────────────────────────────────────────────────────────────────
const createCard = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { card, created } = await cardService.registerCard(req.body, userId);

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
// Devuelve las cartas del inventario del administrador autenticado
const getAllCards = async (req, res, next) => {
  try {
    const { name, type, archetype, folderId } = req.query;
    const filters = {};
    if (name)      filters.name      = name;
    if (type)      filters.type      = type;
    if (archetype) filters.archetype = archetype;
    if (folderId)  filters.folderId  = folderId;

    const userId = req.user.uid;
    const { cards } = await cardService.listCards(filters, userId);

    res.set('Cache-Control', 'private, max-age=0, no-cache');

    return res.status(200).json({
      success: true,
      count: cards.length,
      data: cards,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /portfolio/:slug/cards ─────────────────────────────────────────────────
/**
 * Devuelve el portafolio público de un usuario identificado por su email-slug.
 * Ej: GET /portfolio/angel/cards → cartas de angel@yugioh.com
 */
const getPortfolioBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { name, type, archetype, folderId, cursor, limit } = req.query;

    const uid = await slugToUid(slug);
    if (!uid) {
      throw new AppError(`No existe ningún usuario con el slug "${slug}".`, 404);
    }

    const filters = {};
    if (name)      filters.name      = name;
    if (type)      filters.type      = type;
    if (archetype) filters.archetype = archetype;
    if (folderId)  filters.folderId  = folderId;

    const pagination = {
      paginate: true,
      limit:  Math.min(parseInt(limit) || 20, 100),
      cursor: cursor || null,
    };

    // Ejecutar en paralelo: obtener carpetas y cartas requieren solo uid (ya resuelto)
    const [allFolders, cardResult] = await Promise.all([
      folderService.listFolders(uid),
      cardService.listCards(filters, uid, pagination),
    ]);

    const privateFolderIds = allFolders.filter(f => !f.isPublic).map(f => f.id);

    // Si el usuario pide explícitamente una carpeta privada, no devolver nada
    if (folderId && privateFolderIds.includes(folderId)) {
      return res.status(200).json({
        success: true, slug, count: 0, totalCount: 0, hasMore: false, nextCursor: null, data: []
      });
    }

    const { cards, nextCursor, hasMore, totalCount } = cardResult;

    // Caché pública corta (5s) para balancear actualizaciones rápidas y ahorro de lecturas
    res.set('Cache-Control', 'public, max-age=5, stale-while-revalidate=5');

    return res.status(200).json({
      success: true,
      slug,
      count: cards.length,
      totalCount,
      hasMore,
      nextCursor,
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
    const userId = req.user.uid;
    const card = await cardService.updateCard(req.params.id, req.body, userId);
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
    const userId = req.user.uid;
    await cardService.deleteCard(req.params.id, userId);
    return res.status(200).json({
      success: true,
      message: 'Carta eliminada del inventario.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCard,
  getAllCards,
  getCardById,
  getPortfolioBySlug,
  updateCard,
  deleteCard,
};
