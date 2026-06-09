'use strict';

const { Router } = require('express');
const authRoutes = require('./authRoutes');
const cardRoutes = require('./cardRoutes');
const wishlistRoutes = require('./wishlistRoutes');
const externalRoutes = require('./externalRoutes');
const folderRoutes = require('./folderRoutes');
const ogRoutes = require('./ogRoutes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/cards', cardRoutes);
router.use('/folders', folderRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/external', externalRoutes);
router.use('/og', ogRoutes);

module.exports = router;
