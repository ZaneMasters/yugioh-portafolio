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

// ── Interceptor de respuesta — manejo de errores global ────────────────────────
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
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
