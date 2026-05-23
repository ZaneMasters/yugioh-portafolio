'use strict';

const { Router } = require('express');
const folderController = require('../controllers/folderController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = Router();

// Rutas privadas (requieren autenticación)
router.post('/', authMiddleware, folderController.createFolder);
router.get('/', authMiddleware, folderController.getAllFolders);
router.put('/:id', authMiddleware, folderController.updateFolder);
router.delete('/:id', authMiddleware, folderController.deleteFolder);

// Ruta pública para portafolio
router.get('/portfolio/:slug', folderController.getPublicFoldersBySlug);

module.exports = router;
