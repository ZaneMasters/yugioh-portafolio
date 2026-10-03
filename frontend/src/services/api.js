import axios from 'axios'
import { auth } from '../config/firebase'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
})

// ── Inyectar Firebase ID Token en cada request ────────────────────────────────
// Firebase renueva el token automáticamente cuando expira (cada hora)
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser
  if (user) {
    const token = await user.getIdToken()
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Interceptor de respuesta con auto-refresco de sesión ────────────────────────
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config

    // Si recibimos 401 (token expirado) y no hemos reintentado aún esta petición
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true
      const user = auth.currentUser

      if (user) {
        try {
          // Forzar la renovación del token contra los servidores de Firebase
          const freshToken = await user.getIdToken(true)
          originalRequest.headers.Authorization = `Bearer ${freshToken}`
          // Reintentar la petición original de forma completamente transparente
          return api(originalRequest)
        } catch (refreshErr) {
          console.warn('No se pudo refrescar el token de Firebase:', refreshErr)
        }
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0]?.message ||
      error.message ||
      'Error inesperado'
    const enhancedError = new Error(message)
    enhancedError.status = error.response?.status
    return Promise.reject(enhancedError)
  },
)

export default api
