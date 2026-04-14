import { createContext, useContext, useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { auth } from '../config/firebase'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true) // espera a que Firebase confirme sesión

  // Escuchar cambios de sesión — Firebase la persiste automáticamente
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  /**
   * Login con email + contraseña.
   * La contraseña NUNCA toca el frontend — Firebase la verifica en su servidor.
   * Devuelve true si OK, false si error.
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

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

