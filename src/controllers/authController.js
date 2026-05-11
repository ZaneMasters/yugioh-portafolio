'use strict';

const admin = require('firebase-admin');
const axios = require('axios');
const logger = require('../utils/logger');
const { FIREBASE_API_KEY } = require('../config/env');
const userRepository = require('../repositories/userRepository');
const { invalidateSlugCache } = require('../utils/slugToUid');

/**
 * Cambiar la contraseña del usuario autenticado.
 */
const changePassword = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres.',
      });
    }

    await admin.auth().updateUser(uid, {
      password: newPassword,
    });

    logger.info(`Contraseña actualizada exitosamente para el usuario: ${uid}`);

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada exitosamente.',
    });
  } catch (error) {
    logger.error(`Error al cambiar contraseña: ${error.message}`);
    next(error);
  }
};

/**
 * Recuperar la contraseña enviando un correo con enlace o devolviendo el enlace.
 */
const recoverPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'El email es requerido para recuperar la contraseña.',
      });
    }

    // Verificar si el usuario existe en Firebase Auth
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        // Para no revelar qué correos están registrados, solemos devolver 200 de todas formas
        logger.warn(`Intento de recuperar contraseña para email inexistente: ${email}`);
        return res.status(200).json({
          success: true,
          message: 'Si el correo está registrado, se enviarán las instrucciones para recuperar la contraseña.',
        });
      }
      throw err;
    }

    // Si se configuró la Web API Key, usamos la REST API de Firebase para enviar el correo directamente
    if (FIREBASE_API_KEY) {
      try {
        const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`;
        await axios.post(url, {
          requestType: 'PASSWORD_RESET',
          email: userRecord.email,
        });
        
        logger.info(`Correo de recuperación enviado exitosamente a: ${email} usando REST API`);
        
        return res.status(200).json({
          success: true,
          message: 'Si el correo está registrado, se enviarán las instrucciones para recuperar la contraseña.',
        });
      } catch (restError) {
        logger.error(`Error al enviar correo vía Firebase REST API: ${restError.response?.data?.error?.message || restError.message}`);
        return res.status(500).json({
          success: false,
          message: 'Hubo un error al intentar enviar el correo de recuperación. Revisa la configuración del API Key.',
        });
      }
    } else {
      // Si no hay API Key, generamos el enlace y lo devolvemos en la respuesta
      // (Útil para pruebas en desarrollo, o si el front enviará el email)
      const link = await admin.auth().generatePasswordResetLink(email);
      logger.info(`Enlace de recuperación generado para: ${email} (No se envió correo automático)`);

      return res.status(200).json({
        success: true,
        message: 'No se ha configurado el envío de correo automático. Se ha generado el enlace de recuperación exitosamente.',
        data: { resetLink: link },
      });
    }
  } catch (error) {
    logger.error(`Error al recuperar contraseña: ${error.message}`);
    next(error);
  }
};

/**
 * Obtener perfil del usuario (slug y email)
 */
const getProfile = async (req, res, next) => {
  try {
    const { uid, email } = req.user;
    let profile = await userRepository.getProfile(uid);
    
    // Si no tiene perfil en BD, generar el virtual a partir del email
    if (!profile) {
      profile = {
        slug: email.split('@')[0].toLowerCase(),
        email
      };
    }

    return res.status(200).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

/**
 * Actualizar perfil (especialmente el slug)
 */
const updateProfile = async (req, res, next) => {
  try {
    const { uid, email } = req.user;
    let { slug } = req.body;

    if (!slug || slug.trim() === '') {
      return res.status(400).json({ success: false, message: 'El nombre de usuario (slug) es requerido.' });
    }

    slug = slug.trim().toLowerCase();

    // Validar formato (solo letras, numeros y guiones, sin espacios)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({ success: false, message: 'El nombre de usuario solo puede contener letras minúsculas, números y guiones.' });
    }

    const isTaken = await userRepository.isSlugTaken(slug, uid);
    if (isTaken) {
      return res.status(400).json({ success: false, message: 'Ese nombre de usuario ya está en uso. Por favor elige otro.' });
    }

    // Obtener perfil anterior para limpiar su caché
    const oldProfile = await userRepository.getProfile(uid);
    if (oldProfile && oldProfile.slug) {
      invalidateSlugCache(oldProfile.slug);
    }
    // También limpiar el fallback basado en email
    invalidateSlugCache(email.split('@')[0]);

    const updatedProfile = await userRepository.updateProfile(uid, email, slug);

    return res.status(200).json({
      success: true,
      message: 'Nombre de usuario actualizado correctamente.',
      data: updatedProfile
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  changePassword,
  recoverPassword,
  getProfile,
  updateProfile,
};
