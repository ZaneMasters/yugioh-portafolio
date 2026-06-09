'use strict';

const wishlistService  = require('../services/wishlistService');
const { slugToUid } = require('../utils/slugToUid');
const AppError      = require('../utils/AppError');

const createCard = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { card, created } = await wishlistService.registerCard(req.body, userId);

    const statusCode = created ? 201 : 200;
    const message = created
      ? 'Carta agregada a la wishlist.'
      : `Carta ya en wishlist con esta rareza. Cantidad actualizada a ${card.quantity}.`;

    return res.status(statusCode).json({
      success: true,
      message,
      data: card,
    });
  } catch (err) {
    next(err);
  }
};

const getAllCards = async (req, res, next) => {
  try {
    const { name, type, archetype, cursor, limit } = req.query;
    const filters = {};
    if (name)      filters.name      = name;
    if (type)      filters.type      = type;
    if (archetype) filters.archetype = archetype;

    const userId = req.user.uid;

    const pagination = {
      paginate: true,
      limit: Math.min(parseInt(limit) || 20, 100),
      cursor: cursor || null,
    };

    const { cards, nextCursor, hasMore, totalCount } = await wishlistService.listCards(filters, userId, pagination);

    return res.status(200).json({
      success: true,
      count: cards.length,
      nextCursor,
      hasMore,
      totalCount,
      data: cards,
    });
  } catch (err) {
    next(err);
  }
};

const getPublicWishlist = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { name, type, archetype, cursor, limit } = req.query;
    const filters = {};
    if (name)      filters.name      = name;
    if (type)      filters.type      = type;
    if (archetype) filters.archetype = archetype;

    const targetUid = await slugToUid(slug);
    if (!targetUid) {
      throw new AppError('Usuario no encontrado o URL inválida', 404);
    }

    const pagination = {
      paginate: true,
      limit:  Math.min(parseInt(limit) || 20, 100),
      cursor: cursor || null,
    };

    const [wishlistResult, profile] = await Promise.all([
      wishlistService.listCards(filters, targetUid, pagination),
      require('../repositories/userRepository').getProfile(targetUid),
    ]);

    const { cards, nextCursor, hasMore, totalCount } = wishlistResult;

    const visibleCards = cards.filter(c => !c.isHidden);

    return res.status(200).json({
      success: true,
      whatsapp: profile?.whatsapp || null,
      count: visibleCards.length,
      totalCount,
      hasMore,
      nextCursor,
      data: visibleCards,
    });
  } catch (err) {
    next(err);
  }
};

const updateCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const updatedCard = await wishlistService.updateCard(id, req.body, userId);

    return res.status(200).json({
      success: true,
      message: 'Carta de la wishlist actualizada correctamente.',
      data: updatedCard,
    });
  } catch (err) {
    next(err);
  }
};

const deleteCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    await wishlistService.deleteCard(id, userId);

    return res.status(200).json({
      success: true,
      message: 'Carta eliminada de la wishlist.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCard,
  getAllCards,
  getPublicWishlist,
  updateCard,
  deleteCard,
};
