'use strict';

const admin = require('firebase-admin');
const axios = require('axios');
const logger = require('../utils/logger');
const { GCP_API_KEY } = require('../config/env');
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

    logger.info(`Contrasena actualizada exitosamente para el usuario: ${uid}`);

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada exitosamente.',
    });
  } catch (error) {
    logger.error(`Error al cambiar contrasena: ${error.message}`);
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
        logger.warn(`Intento de recuperar contrasena para email inexistente: ${email}`);
        return res.status(200).json({
          success: true,
          message: 'Si el correo está registrado, se enviarán las instrucciones para recuperar la contraseña.',
        });
      }
      throw err;
    }

    // Si se configuró la Web API Key, usamos la REST API de Firebase para enviar el correo directamente
    if (GCP_API_KEY) {
      try {
        const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${GCP_API_KEY}`;
        await axios.post(url, {
          requestType: 'PASSWORD_RESET',
          email: userRecord.email,
        });

        logger.info(`Correo de recuperacion enviado exitosamente a: ${email} usando REST API`);

        return res.status(200).json({
          success: true,
          message: 'Si el correo está registrado, se enviarán las instrucciones para recuperar la contraseña.',
        });
      } catch (restError) {
        logger.error(`Error al enviar correo via Firebase REST API: ${restError.response?.data?.error?.message || restError.message}`);
        return res.status(500).json({
          success: false,
          message: 'Hubo un error al intentar enviar el correo de recuperación. Revisa la configuración del API Key.',
        });
      }
    } else {
      const link = await admin.auth().generatePasswordResetLink(email);
      logger.info(`Enlace de recuperacion generado para: ${email} (No se envio correo automatico)`);

      return res.status(200).json({
        success: true,
        message: 'No se ha configurado el envío de correo automático. Se ha generado el enlace de recuperación exitosamente.',
        data: { resetLink: link },
      });
    }
  } catch (error) {
    logger.error(`Error al recuperar contrasena: ${error.message}`);
    next(error);
  }
};

/**
 * Obtener perfil del usuario (slug y email).
 *
 * Si el usuario no tiene perfil guardado en Firestore (primer login),
 * lo crea automaticamente usando el prefijo del email como slug por defecto.
 *
 * Esto garantiza que slugToUid() siempre encuentre al usuario en la
 * coleccion 'users' sin tener que recurrir al fallback lento de listUsers().
 */
const getProfile = async (req, res, next) => {
  try {
    const { uid, email } = req.user;
    let profile = await userRepository.getProfile(uid);

    // Primer login: no existe perfil -> persistirlo ahora
    if (!profile) {
      const defaultSlug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '');
      const isTaken     = await userRepository.isSlugTaken(defaultSlug, uid);
      // Si el slug ya esta tomado, agregar los primeros 4 chars del uid para hacerlo unico
      const slug = isTaken ? `${defaultSlug}-${uid.slice(0, 4)}` : defaultSlug;

      profile = await userRepository.updateProfile(uid, email, slug);
      
      // Invertir caché en caso de que hayan intentado visitar su portafolio antes de loguearse (evita 404 fantasma)
      invalidateSlugCache(slug);
      
      logger.info(`Perfil creado automaticamente para ${email} con slug: "${slug}"`);
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

    // Obtener perfil anterior para limpiar su cache
    const oldProfile = await userRepository.getProfile(uid);
    if (oldProfile && oldProfile.slug) {
      invalidateSlugCache(oldProfile.slug);
    }
    // Tambien limpiar el fallback basado en email
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
