'use strict';

const userService = require('../services/userService');

/**
 * GET /api/v1/users/public
 * Lista los coleccionistas registrados con perfil público
 */
const getPublicUsers = async (req, res, next) => {
  try {
    const users = await userService.getPublicUsers();
    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPublicUsers,
};
