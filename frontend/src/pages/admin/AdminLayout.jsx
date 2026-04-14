import { Outlet, NavLink } from 'react-router-dom'
import { Sidebar } from '../../components/layout/Sidebar'
import { Search, Package } from 'lucide-react'

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-[#0d0f1a]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar móvil */}
        <div className="md:hidden flex items-center gap-1 px-4 py-3 bg-[#111827] border-b border-white/5">
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

        {/* Contenido de la ruta hija */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
