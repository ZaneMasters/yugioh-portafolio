import { Outlet, NavLink } from 'react-router-dom'
import { Sidebar } from '../../components/layout/Sidebar'
import { Search, Package, ExternalLink, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/logo.png'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  return (
    <div className="flex min-h-screen ">
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
                to={`/portfolio/${user?.email?.split('@')[0] || 'angel'}`}
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
          <div className="flex items-center gap-1 px-3 py-2">
            <NavLink
              to="/admin/search"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm flex-1 justify-center transition-all ${
                  isActive ? 'bg-amber-500/15 text-amber-400' : 'text-slate-400 hover:bg-white/5'
                }`
              }
            >
              <Search className="w-4 h-4" /> Buscar
            </NavLink>
            <NavLink
              to="/admin/inventory"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm flex-1 justify-center transition-all ${
                  isActive ? 'bg-amber-500/15 text-amber-400' : 'text-slate-400 hover:bg-white/5'
                }`
              }
            >
              <Package className="w-4 h-4" /> Inventario
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
