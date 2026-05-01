import axios from 'axios'

/**
 * Instancia de Axios para endpoints públicos (sin autenticación).
 *
 * A diferencia de `api.js`, esta instancia NO adjunta el Firebase ID Token
 * en cada request, evitando así el delay de inicialización del SDK de Firebase
 * (200–800ms) en la primera carga de páginas públicas como el portafolio.
 *
 * Usar para:
 *  - GET /cards/portfolio/:slug/cards  (portafolio público)
 *  - GET /wishlist/public/:slug        (wishlist pública)
 */
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// ── Interceptor de respuesta — mismo manejo de errores que api.js ─────────────
publicApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0]?.message ||
      error.message ||
      'Error inesperado'
    return Promise.reject(new Error(message))
  },
)

export default publicApi
