'use strict';

const folderService = require('../services/folderService');
const { slugToUid } = require('../utils/slugToUid');
const AppError = require('../utils/AppError');

const createFolder = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const folder = await folderService.createFolder(req.body, userId);
    return res.status(201).json({
      success: true,
      message: 'Carpeta creada correctamente.',
      data: folder,
    });
  } catch (err) {
    next(err);
  }
};

const getAllFolders = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const folders = await folderService.listFolders(userId);
    return res.status(200).json({
      success: true,
      data: folders,
    });
  } catch (err) {
    next(err);
  }
};

const getPublicFoldersBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const uid = await slugToUid(slug);
    if (!uid) {
      throw new AppError(`No existe ningún usuario con el slug "${slug}".`, 404);
    }
    const folders = await folderService.listPublicFolders(uid);
    return res.status(200).json({
      success: true,
      data: folders,
    });
  } catch (err) {
    next(err);
  }
};

const updateFolder = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const folder = await folderService.updateFolder(req.params.id, req.body, userId);
    return res.status(200).json({
      success: true,
      message: 'Carpeta actualizada correctamente.',
      data: folder,
    });
  } catch (err) {
    next(err);
  }
};

const deleteFolder = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    await folderService.deleteFolder(req.params.id, userId);
    return res.status(200).json({
      success: true,
      message: 'Carpeta eliminada correctamente.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createFolder,
  getAllFolders,
  getPublicFoldersBySlug,
  updateFolder,
  deleteFolder,
};
