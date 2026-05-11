'use strict';

const { Router } = require('express');
const cardRoutes = require('./cardRoutes');
const externalRoutes = require('./externalRoutes');
const wishlistRoutes = require('./wishlistRoutes');
const authRoutes = require('./authRoutes');

const router = Router();

router.use('/cards', cardRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/external', externalRoutes);
router.use('/auth', authRoutes);

module.exports = router;
