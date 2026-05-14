import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import DiagnosticsPage from '@/pages/DiagnosticsPage'
import DiagnosticsResultPage from '@/pages/DiagnosticsResultPage'
import MarketplacePage from '@/pages/MarketplacePage'
import CarDetailPage from '@/pages/CarDetailPage'
import OrdersPage from '@/pages/OrdersPage'
import AdminPage from '@/pages/admin/AdminPage'
import GaragePage from '@/pages/garage/GaragePage'
import GarageCarDetailPage from '@/pages/garage/CarDetailPage'
import CarFormPage from '@/pages/garage/CarFormPage'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route path="/diagnostics" element={<DiagnosticsPage />} />
            <Route path="/diagnostics/result" element={<DiagnosticsResultPage />} />

            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/marketplace/:id" element={<CarDetailPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/admin" element={<AdminPage />} />

            <Route path="/garage" element={<ProtectedRoute><GaragePage /></ProtectedRoute>} />
            <Route path="/garage/new" element={<ProtectedRoute><CarFormPage /></ProtectedRoute>} />
            <Route path="/garage/:id" element={<ProtectedRoute><GarageCarDetailPage /></ProtectedRoute>} />
            <Route path="/garage/:id/edit" element={<ProtectedRoute><CarFormPage /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
