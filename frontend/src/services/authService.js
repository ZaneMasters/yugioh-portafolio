import api from './api'

/**
 * Solicita el envío de un correo de recuperación de contraseña.
 * @param {string} email - Correo del usuario
 */
export const recoverPassword = async (email) => {
  const data = await api.post('/auth/recover-password', { email })
  return data
}

/**
 * Cambia la contraseña del usuario actualmente autenticado.
 * Requiere que el interceptor envíe el ID token.
 * @param {string} newPassword - Nueva contraseña
 */
export const changePassword = async (newPassword) => {
  const data = await api.post('/auth/change-password', { newPassword })
  return data
}

/**
 * Obtiene el perfil del usuario actual.
 */
export const getProfile = async () => {
  const data = await api.get('/auth/profile')
  return data
}

/**
 * Actualiza el perfil del usuario (ej. slug).
 * @param {Object} body - Datos a actualizar (ej. { slug: 'nuevo-slug' })
 */
export const updateProfile = async (body) => {
  const data = await api.put('/auth/profile', body)
  return data
}
