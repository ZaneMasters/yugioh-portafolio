'use strict';

const folderRepository = require('../repositories/folderRepository');
const cardService = require('./cardService');
const AppError = require('../utils/AppError');

async function createFolder(data, userId) {
  if (!data.name || typeof data.name !== 'string') {
    throw new AppError('El nombre de la carpeta es inválido o está vacío.', 400);
  }

  return folderRepository.create({
    userId,
    name: data.name.trim(),
    isPublic: data.isPublic !== undefined ? Boolean(data.isPublic) : true,
  });
}

async function listFolders(userId) {
  return folderRepository.findAll(userId);
}

async function listPublicFolders(userId) {
  return folderRepository.findPublicByUserId(userId);
}

async function updateFolder(id, data, userId) {
  const updates = {};
  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.isPublic !== undefined) updates.isPublic = Boolean(data.isPublic);

  const updated = await folderRepository.update(id, updates, userId);
  cardService.invalidateInventoryCache(userId);
  return updated;
}

async function deleteFolder(id, userId) {
  const deleted = await folderRepository.delete(id, userId);
  cardService.invalidateInventoryCache(userId);
  return deleted;
}

module.exports = {
  createFolder,
  listFolders,
  listPublicFolders,
  updateFolder,
  deleteFolder,
};
