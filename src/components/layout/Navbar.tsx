import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, User, LogOut, ChevronDown, ShieldCheck, ClipboardList } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

const navLinks = [
  { label: 'Маркетплейс', to: '/marketplace' },
  { label: 'AI-діагностика', to: '/diagnostics' },
  { label: 'Гараж', to: '/garage' },
  { label: 'Про проект', to: '/about' },
]

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [pendingOrders, setPendingOrders] = useState(0)
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Користувач'
  const isAdmin = profile?.role === 'admin'

  // Fetch pending orders count
  useEffect(() => {
    if (!user) { setPendingOrders(0); return }
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .then(({ count }) => setPendingOrders(count || 0))
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    setUserMenuOpen(false)
    setPendingOrders(0)
    navigate('/')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-white text-xs font-bold">C</span>
          </div>
          <span className="text-white font-semibold tracking-widest text-sm uppercase">CARMA</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to}
              className="text-white/70 hover:text-white text-sm tracking-wide transition-colors duration-200">
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="hidden md:flex items-center gap-4">
              <span className="text-white/60 text-sm">
                Привіт, <span className="text-white font-medium">{displayName}</span>
              </span>

              {/* User dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors"
                >
                  {/* Avatar with notification dot */}
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                      <User size={14} />
                    </div>
                    {pendingOrders > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-black" />
                    )}
                  </div>
                  <ChevronDown size={12} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-black border border-white/10 shadow-xl">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-white/40 text-xs truncate">{user.email}</p>
                      {isAdmin && (
                        <p className="text-white/25 text-[10px] mt-0.5 tracking-widest uppercase">Адміністратор</p>
                      )}
                    </div>

                    {/* My orders */}
                    <Link to="/orders" onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <ClipboardList size={14} />
                        Мої заявки
                      </div>
                      {pendingOrders > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {pendingOrders}
                        </span>
                      )}
                    </Link>

                    {isAdmin && (
                      <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                        <ShieldCheck size={14} />
                        Панель адміна
                      </Link>
                    )}

                    <button onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors border-t border-white/5">
                      <LogOut size={14} />
                      Вийти
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              <Link to="/login"
                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors duration-200">
                <User size={18} />
              </Link>
              <Link to="/register"
                className="bg-white text-black text-sm font-medium px-5 py-2 hover:bg-white/90 transition-colors duration-200">
                Розпочати
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <div className="relative md:hidden">
            <button className="text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            {pendingOrders > 0 && !mobileMenuOpen && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black border-t border-white/10 px-6 py-4 flex flex-col gap-4">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} onClick={() => setMobileMenuOpen(false)}
              className="text-white/70 hover:text-white text-sm tracking-wide transition-colors">
              {link.label}
            </Link>
          ))}

          {user ? (
            <div className="pt-2 border-t border-white/10">
              <p className="text-white/60 text-sm mb-3">
                Привіт, <span className="text-white font-medium">{displayName}</span>
              </p>
              <Link to="/orders" onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between text-white/50 hover:text-white text-sm transition-colors mb-3">
                <div className="flex items-center gap-2">
                  <ClipboardList size={14} />
                  Мої заявки
                </div>
                {pendingOrders > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {pendingOrders}
                  </span>
                )}
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors mb-3">
                  <ShieldCheck size={14} />
                  Панель адміна
                </Link>
              )}
              <button onClick={handleSignOut}
                className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors">
                <LogOut size={14} />
                Вийти
              </button>
            </div>
          ) : (
            <Link to="/register"
              className="bg-white text-black text-sm font-medium px-5 py-2 text-center mt-2">
              Розпочати
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
