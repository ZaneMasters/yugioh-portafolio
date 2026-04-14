import { NavLink } from 'react-router-dom'
import { LayoutGrid, Settings } from 'lucide-react'

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Brand */}
        <NavLink to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-purple-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span className="text-white font-black text-sm">Yu</span>
          </div>
          <span className="font-bold text-white text-lg tracking-tight group-hover:text-amber-400 transition-colors">
            Gi-Oh!{' '}
            <span className="text-gradient font-black">Inventory</span>
          </span>
        </NavLink>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${
                isActive
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`
            }
          >
            <LayoutGrid className="w-4 h-4" />
            Galería
          </NavLink>
          <NavLink
            to="/admin/search"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${
                isActive || window.location.pathname.startsWith('/admin')
                  ? 'text-purple-400 bg-purple-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`
            }
          >
            <Settings className="w-4 h-4" />
            Admin
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
