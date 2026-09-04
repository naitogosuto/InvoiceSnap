import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Sidebar } from '@/components/ui/Sidebar'
import { ToastContainer } from '@/components/ui/Toast'
import { useUIStore } from '@/store/uiStore'

// Pages
import { Landing } from '@/pages/Landing'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { Dashboard } from '@/pages/Dashboard'
import { InvoiceCreate } from '@/pages/InvoiceCreate'
import { InvoiceList } from '@/pages/InvoiceList'
import { Clients } from '@/pages/Clients'
import { Products } from '@/pages/Products'
import { Settings } from '@/pages/Settings'
import { AuthCallback } from '@/pages/AuthCallback'

// Protected route wrapper
function ProtectedRoute({ children }) {
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-primary-600 mx-auto" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-500 mt-2">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

// Protected layout with sidebar
function ProtectedLayout({ children }) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const profile = useAuthStore((s) => s.profile)

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div
        className={`transition-all duration-300 ${sidebarOpen ? 'ml-60' : 'ml-16'}`}
      >
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              Plan:{' '}
              {profile?.subscription_tier === 'pro' ? (
                <span className="font-medium text-primary-600">Pro</span>
              ) : (
                <span className="font-medium text-gray-700">Gratuito</span>
              )}
            </span>
            {profile?.subscription_tier !== 'pro' && (
              <Link
                to="/settings"
                className="text-xs text-primary-600 hover:text-primary-700 font-medium underline"
              >
                Mejorar
              </Link>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export function App() {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <InvoiceList />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices/new"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <InvoiceCreate />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices/edit/:id"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <InvoiceCreate />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Clients />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Products />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Settings />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        {/* Auth callback (Google OAuth) */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
