'use strict';

const { slugToUid } = require('../utils/slugToUid');
const cardService = require('../services/cardService');
const wishlistService = require('../services/wishlistService');
const ogImageService = require('../services/ogImageService');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const getOgImage = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { tab } = req.query; // 'wishlist' or 'inventory'

    const uid = await slugToUid(slug);
    if (!uid) {
      throw new AppError(`Usuario no encontrado para slug: ${slug}`, 404);
    }

    const type = tab === 'wishlist' ? 'wishlist' : 'inventory';

    // Get the first 5 cards
    const pagination = { limit: 5, paginate: true };
    let cards = [];
    
    if (type === 'wishlist') {
      const result = await wishlistService.listCards({}, uid, pagination);
      cards = result.cards;
    } else {
      const result = await cardService.listCards({}, uid, pagination);
      cards = result.cards;
    }

    if (!cards || cards.length === 0) {
      throw new AppError('No hay cartas para mostrar', 404);
    }

    const imageBuffer = await ogImageService.generateOGImage(cards, type);

    // Set cache control for 24 hours
    res.set('Cache-Control', 'public, max-age=86400');
    res.set('Content-Type', 'image/jpeg');
    return res.status(200).send(imageBuffer);
  } catch (err) {
    logger.error('Error generando OG Image:', err.message);
    // Return a 1x1 transparent pixel or an error image to avoid breaking the crawler
    res.status(err.statusCode || 500).send('Error');
  }
};

module.exports = {
  getOgImage
};
