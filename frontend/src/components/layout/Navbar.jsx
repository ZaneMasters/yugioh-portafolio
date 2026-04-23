import { NavLink, useLocation } from 'react-router-dom'
import { LayoutGrid, Settings, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { YuGiOhIcon } from '../ui/YuGiOhIcon'

export function Navbar() {
  const { user } = useAuth()
  const location = useLocation()

  // Derivar el slug del email del usuario logueado
  const mySlug = user?.email ? user.email.split('@')[0] : null

  // Si estamos viendo un portafolio específico, mantenernos en ese portafolio.
  // Si estamos en el admin, ir al portafolio del usuario actual (mySlug).
  const match = location.pathname.match(/^\/portfolio\/([^/]+)/)
  const currentPortfolioSlug = match ? match[1] : (mySlug || 'angel')
  
  const galleryLink = `/portfolio/${currentPortfolioSlug}`

  return (
    <header className="sticky top-0 z-30 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Brand */}
        <NavLink to={galleryLink} className="flex items-center gap-2.5 group shrink-0">
          <YuGiOhIcon className="w-8 h-8 text-[#5895f9] group-hover:text-amber-400 transition-colors" />
          <span className="font-bold text-white text-lg tracking-tight group-hover:text-amber-400 transition-colors">
            Gi-Oh! <span className="text-gradient font-black hidden sm:inline">Inventory</span>
          </span>
        </NavLink>

        {/* Nav */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
          {/* Portafolio propio — solo si está logueado */}
          {mySlug && (
            <NavLink
              to={`/portfolio/${mySlug}`}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-2.5 py-2 sm:px-3 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'text-amber-400 bg-amber-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
              title="Mi Portafolio"
            >
              <User className="w-4 h-4 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Mi Portafolio</span>
            </NavLink>
          )}

          {/* Galería principal (context-aware: se queda en el portafolio actual) */}
          <NavLink
            to={galleryLink}
            end
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-2.5 py-2 sm:px-3 rounded-lg text-sm transition-all ${
                isActive
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`
            }
            title="Galería"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Galería</span>
          </NavLink>

          {/* Admin / Login */}
          {user ? (
            <NavLink
              to="/admin/search"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-2.5 py-2 sm:px-3 rounded-lg text-sm transition-all ${
                  isActive || location.pathname.startsWith('/admin')
                    ? 'text-purple-400 bg-purple-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
              title="Admin"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </NavLink>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-2.5 py-2 sm:px-3 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'text-purple-400 bg-purple-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
              title="Login Admin"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Login</span>
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  )
}
