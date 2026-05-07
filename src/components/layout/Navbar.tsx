// Компонент навігаційної панелі (шапки сайту)
// Фіксована позиція зверху, адаптивна для мобільних пристроїв

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, User } from 'lucide-react'

// Масив посилань для навігації
// Якщо додавати нові сторінки - просто додай сюди об'єкт
const navLinks = [
  { label: 'Маркетплейс', to: '/marketplace' },
  { label: 'AI-діагностика', to: '/diagnostics' },
  { label: 'Гараж', to: '/garage' },
  { label: 'Про проект', to: '/about' },
]

export default function Navbar() {
  // Стан для мобільного меню (відкрите/закрите)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Логотип */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-white text-xs font-bold">C</span>
          </div>
          <span className="text-white font-semibold tracking-widest text-sm uppercase">CARMA</span>
        </Link>

        {/* Навігація для десктопу - прихована на мобільних */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="text-white/70 hover:text-white text-sm tracking-wide transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Кнопки входу та реєстрації */}
        <div className="flex items-center gap-4">
          {/* Іконка профілю для входу */}
          <Link
            to="/login"
            className="hidden md:flex items-center gap-2 text-white/70 hover:text-white transition-colors duration-200"
          >
            <User size={18} />
          </Link>

          {/* Кнопка реєстрації */}
          <Link
            to="/register"
            className="hidden md:block bg-white text-black text-sm font-medium px-5 py-2 hover:bg-white/90 transition-colors duration-200"
          >
            Розпочати
          </Link>

          {/* Гамбургер для мобільних */}
          <button
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Мобільне меню - показується тільки коли mobileMenuOpen = true */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black border-t border-white/10 px-6 py-4 flex flex-col gap-4">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)} // закриваємо меню після кліку
              className="text-white/70 hover:text-white text-sm tracking-wide transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/register"
            className="bg-white text-black text-sm font-medium px-5 py-2 text-center mt-2"
          >
            Розпочати
          </Link>
        </div>
      )}
    </header>
  )
}
