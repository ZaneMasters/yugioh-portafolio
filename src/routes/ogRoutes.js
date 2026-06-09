'use strict';

const { Router } = require('express');
const ogController = require('../controllers/ogController');

const router = Router();

router.get('/portfolio/:slug.png', ogController.getOgImage);

module.exports = router;
