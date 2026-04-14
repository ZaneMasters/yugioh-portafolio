'use strict';

const { Router } = require('express');
const cardRoutes = require('./cardRoutes');
const externalRoutes = require('./externalRoutes');

const router = Router();

router.use('/cards', cardRoutes);
router.use('/external', externalRoutes);

module.exports = router;
