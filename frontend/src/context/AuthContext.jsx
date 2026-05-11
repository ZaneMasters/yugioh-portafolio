import { createContext, useContext, useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { auth } from '../config/firebase'
import toast from 'react-hot-toast'
import { getProfile } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Escuchar cambios de sesión — Firebase la persiste automáticamente
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        try {
          // Obtener el slug y datos del backend
          const res = await getProfile()
          setProfile(res.data)
        } catch (error) {
          console.error('Error fetching profile:', error)
          // Fallback al slug del email si falla la red
          setProfile({ slug: firebaseUser.email.split('@')[0], email: firebaseUser.email })
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  /**
   * Login con email + contraseña.
   */
  const login = async (email, password) => {
    try {
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

  const logout = async () => {
    await signOut(auth)
    toast.success('Sesión cerrada')
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
