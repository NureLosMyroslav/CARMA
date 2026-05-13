// Головний файл додатку
// Тут налаштовується роутинг, глобальний стан запитів і контекст авторизації

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'

import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import DiagnosticsPage from '@/pages/DiagnosticsPage'
import DiagnosticsResultPage from '@/pages/DiagnosticsResultPage'
import MarketplacePage from '@/pages/MarketplacePage'
import CarDetailPage from '@/pages/CarDetailPage'
import OrdersPage from '@/pages/OrdersPage'
import AdminPage from '@/pages/admin/AdminPage'

// Створюємо клієнт для кешування запитів до Supabase
const queryClient = new QueryClient()

function App() {
  return (
    // QueryClientProvider - для useQuery у всіх компонентах
    <QueryClientProvider client={queryClient}>
      {/* AuthProvider - глобальний стан авторизації */}
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Публічні сторінки - доступні всім включно з гостями */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/diagnostics" element={<DiagnosticsPage />} />
            <Route path="/diagnostics/result" element={<DiagnosticsResultPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/marketplace/:id" element={<CarDetailPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
