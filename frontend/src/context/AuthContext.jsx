import { createContext, useContext, useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { auth } from '../config/firebase'
import toast from 'react-hot-toast'
import { getProfile } from '../services/authService'

const AuthContext = createContext(null)

const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000 // 1 hora de inactividad
const LAST_ACTIVITY_KEY     = 'ygo_admin_last_activity'

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const queryClient           = useQueryClient()

  // ── Cierre de sesión (manual o por inactividad) ─────────────────────────────
  const logout = async (dueToInactivity = false) => {
    localStorage.removeItem(LAST_ACTIVITY_KEY)
    await signOut(auth)
    if (dueToInactivity) {
      toast.error('Tu sesión se cerró automáticamente por 1 hora de inactividad.', {
        duration: 6000,
        icon: '⏳',
      })
    } else {
      toast.success('Sesión cerrada')
    }
  }

  // ── Escuchar cambios de sesión de Firebase ──────────────────────────────────
  useEffect(() => {
    let mounted = true

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return

      setUser(firebaseUser)

      if (firebaseUser) {
        // Inicializar timestamp de actividad reciente
        if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
          localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString())
        }

        try {
          const res = await getProfile()
          if (mounted) setProfile(res.data)
        } catch (error) {
          console.error('Error fetching profile:', error)
          // Fallback al slug del email si falla la red
          if (mounted) setProfile({ slug: firebaseUser.email.split('@')[0], email: firebaseUser.email })
        } finally {
          if (mounted) setLoading(false)
        }
      } else {
        queryClient.clear()
        localStorage.removeItem(LAST_ACTIVITY_KEY)
        if (mounted) {
          setProfile(null)
          setLoading(false)
        }
      }
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  // ── Detección de Actividad vs Inactividad (60 minutos) ───────────────────────
  useEffect(() => {
    if (!user) return

    let lastWrite = 0

    // Registrar actividad del usuario (throttled cada 30 segundos)
    const recordActivity = () => {
      const now = Date.now()
      if (now - lastWrite > 30000) {
        lastWrite = now
        localStorage.setItem(LAST_ACTIVITY_KEY, now.toString())
      }
    }

    // Verificar si se ha superado la hora de inactividad
    const checkInactivity = () => {
      const stored = localStorage.getItem(LAST_ACTIVITY_KEY)
      const lastActive = stored ? parseInt(stored, 10) : Date.now()
      const diff = Date.now() - lastActive

      if (diff >= INACTIVITY_TIMEOUT_MS) {
        logout(true)
      }
    }

    // Eventos que representan interacción real del usuario
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart']
    activityEvents.forEach((evt) => window.addEventListener(evt, recordActivity, { passive: true }))

    // Chequeo periódico cada 60 segundos
    const intervalId = setInterval(checkInactivity, 60000)

    // Al volver a enfocar la pestaña, comprobar de inmediato si ya pasó 1 hora
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkInactivity()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      activityEvents.forEach((evt) => window.removeEventListener(evt, recordActivity))
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user])

  /**
   * Login con email + contraseña.
   */
  const login = async (email, password) => {
    try {
      queryClient.clear()
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString())
      await signInWithEmailAndPassword(auth, email, password)
      toast.success('¡Bienvenido al panel de administración!')
      return true
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'Email o contraseña incorrectos'
        : err.code === 'auth/too-many-requests'
        ? 'Demasiados intentos fallidos. Espera un momento.'
        : 'Error al iniciar sesión'
      toast.error(msg)
      return false
    }
  }

  const updateProfileContext = (newProfile) => {
    setProfile(newProfile)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, updateProfileContext }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
