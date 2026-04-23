import { NavLink } from 'react-router-dom'
import { Search, Package, ExternalLink, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/logo.png'

const navItems = [
  { to: '/admin/search', icon: Search, label: 'Buscar Cartas' },
  { to: '/admin/inventory', icon: Package, label: 'Mi Inventario' },
]

export function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 bg-[#111827]/80 backdrop-blur-sm border-r border-white/5 min-h-screen">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Yu-Gi-Oh!" className="h-8 w-auto object-contain" />
          <div>
            <p className="text-xs text-slate-500">Panel Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-amber-500/15 text-amber-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : ''}`} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/5">
        <div className="flex gap-2">
          <NavLink
            to={`/portfolio/${user?.email?.split('@')[0] || 'angel'}`}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Galería
          </NavLink>
          <button
            onClick={logout}
            className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Salir
          </button>
        </div>
      </div>
    </aside>
  )
}

