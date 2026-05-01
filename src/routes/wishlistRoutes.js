'use strict';

const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/public/:slug', wishlistController.getPublicWishlist);

router.use(authMiddleware);

router.get('/', wishlistController.getAllCards);
router.post('/', wishlistController.createCard);
router.put('/:id', wishlistController.updateCard);
router.delete('/:id', wishlistController.deleteCard);

module.exports = router;
