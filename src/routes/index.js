'use strict';

const { Router } = require('express');
const cardRoutes = require('./cardRoutes');
const externalRoutes = require('./externalRoutes');
const wishlistRoutes = require('./wishlistRoutes');

const router = Router();

router.use('/cards', cardRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/external', externalRoutes);

module.exports = router;
