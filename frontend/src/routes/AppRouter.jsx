import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { ProtectedRoute } from '../components/layout/ProtectedRoute'
import GalleryPage from '../pages/public/GalleryPage'
import LoginPage from '../pages/auth/LoginPage'
import AdminLayout from '../pages/admin/AdminLayout'
import SearchPage from '../pages/admin/SearchPage'
import InventoryPage from '../pages/admin/InventoryPage'

export default function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Vista pública */}
          <Route path="/" element={<GalleryPage />} />

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
