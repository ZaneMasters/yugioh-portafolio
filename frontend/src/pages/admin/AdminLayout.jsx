import { Outlet, NavLink } from 'react-router-dom'
import { Sidebar } from '../../components/layout/Sidebar'
import { Search, Package, ExternalLink, LogOut, Key, Store } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/logo.png'

export default function AdminLayout() {
  const { user, profile, logout } = useAuth()
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar móvil */}
        <div className="md:hidden flex flex-col bg-[#111827]/80 backdrop-blur-sm border-b border-white/5">
          {/* Fila 1: Logo e iconos minimalistas */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Yu-Gi-Oh!" className="h-6 w-auto object-contain" />
              <span className="text-white text-xs font-bold tracking-wider">PANEL ADMIN</span>
            </div>
            <div className="flex items-center gap-4">
              <NavLink
                to={`/portfolio/${profile?.slug || user?.email?.split('@')[0] || 'angel'}`}
                className="text-slate-500 hover:text-amber-400 transition-colors"
                title="Ir a mi Galería"
              >
                <ExternalLink className="w-4 h-4" />
              </NavLink>
              <button
                onClick={logout}
                className="text-slate-500 hover:text-red-400 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Fila 2: Tabs principales */}
          <div className="flex items-center justify-between px-2 py-1.5 border-t border-white/5 bg-[#111827]">
            <NavLink
              to="/admin/search"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-medium transition-all flex-1 mx-0.5 ${
                  isActive ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Search className="w-5 h-5" />
              <span>Buscar</span>
            </NavLink>
            <NavLink
              to="/admin/inventory"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-medium transition-all flex-1 mx-0.5 ${
                  isActive ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Package className="w-5 h-5" />
              <span>Inventario</span>
            </NavLink>
            <NavLink
              to="/admin/store"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-medium transition-all flex-1 mx-0.5 ${
                  isActive ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Store className="w-5 h-5" />
              <span>Tienda</span>
            </NavLink>
            <NavLink
              to="/admin/profile"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-medium transition-all flex-1 mx-0.5 ${
                  isActive ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Key className="w-5 h-5" />
              <span>Perfil</span>
            </NavLink>
          </div>
        </div>

        {/* Contenido de la ruta hija */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
