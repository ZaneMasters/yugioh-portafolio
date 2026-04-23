import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { ProtectedRoute } from '../components/layout/ProtectedRoute'
import GalleryPage from '../pages/public/GalleryPage'
import PortfolioPage from '../pages/public/PortfolioPage'
import LoginPage from '../pages/auth/LoginPage'
import AdminLayout from '../pages/admin/AdminLayout'
import SearchPage from '../pages/admin/SearchPage'
import InventoryPage from '../pages/admin/InventoryPage'

// Slug del admin principal — usuarios acceden a / y son redirigidos aquí
const DEFAULT_PORTFOLIO_SLUG = 'angel'

export default function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Raíz → portafolio del admin principal */}
          <Route
            path="/"
            element={<Navigate to={`/portfolio/${DEFAULT_PORTFOLIO_SLUG}`} replace />}
          />

          {/* Portafolio público de cualquier usuario por slug */}
          <Route path="/portfolio/:slug" element={<PortfolioPage />} />

          {/* Galería global legacy (opcional, se puede eliminar) */}
          <Route path="/gallery" element={<GalleryPage />} />

          {/* Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Panel admin — protegido */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="search" replace />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="inventory" element={<InventoryPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
