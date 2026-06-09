import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { ProtectedRoute } from '../components/layout/ProtectedRoute'

// Carga perezosa (Lazy Loading) para optimizar el peso del bundle inicial
const GalleryPage = lazy(() => import('../pages/public/GalleryPage'))
const HomePage = lazy(() => import('../pages/public/HomePage'))
const PortfolioPage = lazy(() => import('../pages/public/PortfolioPage'))
const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const AdminLayout = lazy(() => import('../pages/admin/AdminLayout'))
const SearchPage = lazy(() => import('../pages/admin/SearchPage'))
const InventoryPage = lazy(() => import('../pages/admin/InventoryPage'))
const RecoverPasswordPage = lazy(() => import('../pages/auth/RecoverPasswordPage'))
const ProfilePage = lazy(() => import('../pages/admin/ProfilePage'))
const StoreSettingsPage = lazy(() => import('../pages/admin/StoreSettingsPage'))


// Fallback visual mientras se descargan los chunks de las páginas
const PageLoader = () => (
  <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
  </div>
)

export default function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Raíz → landing page */}
            <Route path="/" element={<HomePage />} />

            {/* Portafolio público de cualquier usuario por slug */}
            <Route path="/portfolio/:slug" element={<PortfolioPage />} />

            {/* Galería global legacy (opcional, se puede eliminar) */}
            <Route path="/gallery" element={<GalleryPage />} />

            {/* Login y Recuperar */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/recover-password" element={<RecoverPasswordPage />} />

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
              <Route path="store" element={<StoreSettingsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
