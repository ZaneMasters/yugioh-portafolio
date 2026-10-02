import { Outlet, NavLink } from 'react-router-dom'
import { Sidebar } from '../../components/layout/Sidebar'
import { Search, Package, ClipboardList, ExternalLink, LogOut, Key, Store } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/logo.webp'

export default function AdminLayout() {
  const { user, profile, logout } = useAuth()
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top bar móvil (branding y acciones rápidas) */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#111827]/90 backdrop-blur-sm border-b border-white/5 shrink-0 z-40">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Yu-Gi-Oh!" className="h-6 w-auto object-contain" />
            <span className="text-white text-xs font-bold tracking-wider">PANEL ADMIN</span>
          </div>
          <div className="flex items-center gap-3">
            <NavLink
              to={`/portfolio/${profile?.slug || user?.email?.split('@')[0] || 'angel'}`}
              className="text-slate-400 hover:text-amber-400 transition-colors p-1.5 rounded-lg hover:bg-white/5"
              title="Ir a mi Galería"
            >
              <ExternalLink className="w-4 h-4" />
            </NavLink>
            <button
              onClick={logout}
              className="text-slate-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/5"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contenido de la ruta hija */}
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          <Outlet />
        </main>

        {/* Bottom bar móvil fija (accesible para el pulgar en móviles) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-1 py-2 bg-[#111827]/95 backdrop-blur-md border-t border-white/10 shadow-2xl safe-area-pb">
          <NavLink
            to="/admin/search"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[10px] font-medium transition-all ${
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
              `flex flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[10px] font-medium transition-all ${
                isActive ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <Package className="w-5 h-5" />
            <span>Inventario</span>
          </NavLink>
          <NavLink
            to="/admin/orders"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[10px] font-medium transition-all ${
                isActive ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <ClipboardList className="w-5 h-5" />
            <span>Pedidos</span>
          </NavLink>
          <NavLink
            to="/admin/store"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[10px] font-medium transition-all ${
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
              `flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-xl text-[10px] font-medium transition-all ${
                isActive ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <Key className="w-5 h-5" />
            <span>Perfil</span>
          </NavLink>
        </nav>
      </div>
    </div>
  )
}
