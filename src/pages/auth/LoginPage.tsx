// Сторінка входу в систему
// Підтримує вхід і для звичайних юзерів, і для адміністраторів
// Після входу перенаправляє: адмін → /admin, юзер → /garage

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const navigate = useNavigate()

  // Стан форми
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isAdminMode, setIsAdminMode] = useState(false) // перемикач режиму входу
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Авторизація через Supabase Auth
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      // Перекладаємо типові помилки на зрозумілу мову
      if (authError.message.includes('Invalid login credentials')) {
        setError('Невірний email або пароль')
      } else if (authError.message.includes('Email not confirmed')) {
        setError('Підтвердьте email перед входом')
      } else {
        setError('Помилка входу. Спробуйте ще раз.')
      }
      setLoading(false)
      return
    }

    // Перевіряємо роль користувача в нашій таблиці profiles
    if (data.user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      // Перенаправляємо залежно від ролі
      if (profileData?.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/garage')
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black text-white flex">

      {/* Ліва частина - форма входу */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12">

        {/* Повернутись на головну */}
        <Link
          to="/"
          className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-12 transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          На головну
        </Link>

        {/* Логотип */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="text-white font-semibold tracking-widest text-sm uppercase">CARMA</span>
          </div>

          <h1 className="text-3xl font-light mb-2">З поверненням</h1>
          <p className="text-white/40 text-sm">Увійдіть у свій акаунт</p>
        </div>

        {/* Перемикач режиму: юзер / адмін */}
        <div className="flex bg-white/5 rounded p-1 mb-8 w-fit">
          <button
            type="button"
            onClick={() => setIsAdminMode(false)}
            className={`px-4 py-1.5 text-sm rounded transition-colors ${
              !isAdminMode ? 'bg-white text-black' : 'text-white/50 hover:text-white'
            }`}
          >
            Користувач
          </button>
          <button
            type="button"
            onClick={() => setIsAdminMode(true)}
            className={`px-4 py-1.5 text-sm rounded transition-colors flex items-center gap-1.5 ${
              isAdminMode ? 'bg-white text-black' : 'text-white/50 hover:text-white'
            }`}
          >
            <ShieldCheck size={14} />
            Адміністратор
          </button>
        </div>

        {/* Показуємо підказку в режимі адміна */}
        {isAdminMode && (
          <div className="border border-white/20 bg-white/5 px-4 py-3 text-sm text-white/60 mb-6 flex items-center gap-2">
            <ShieldCheck size={14} className="text-white/40 shrink-0" />
            Вхід для адміністраторів платформи CARMA
          </div>
        )}

        {/* Форма */}
        <form onSubmit={handleLogin} className="space-y-5 max-w-sm">

          {/* Email */}
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-white/40 transition-colors placeholder:text-white/20"
            />
          </div>

          {/* Пароль */}
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">
              Пароль
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 pr-12 text-sm outline-none focus:border-white/40 transition-colors placeholder:text-white/20"
              />
              {/* Кнопка показати/сховати пароль */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Помилка авторизації */}
          {error && (
            <div className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Кнопка входу */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black py-3 text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Вхід...' : 'Увійти'}
          </button>

          {/* Забув пароль */}
          <div className="text-center">
            <button
              type="button"
              className="text-white/30 hover:text-white/60 text-xs transition-colors"
              onClick={() => alert('TODO: відновлення пароля')} // TODO: зробити відновлення пароля
            >
              Забули пароль?
            </button>
          </div>
        </form>

        {/* Посилання на реєстрацію - тільки для звичайних юзерів */}
        {!isAdminMode && (
          <p className="text-white/30 text-sm mt-8">
            Ще немає акаунту?{' '}
            <Link to="/register" className="text-white hover:text-white/70 transition-colors">
              Зареєструватись
            </Link>
          </p>
        )}

        {/* Гостьовий режим */}
        <div className="mt-6">
          <Link
            to="/"
            className="text-white/20 hover:text-white/40 text-xs transition-colors"
          >
            Продовжити як гість →
          </Link>
        </div>
      </div>

      {/* Права частина - декоративна (прихована на мобільних) */}
      <div className="hidden lg:block flex-1 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=1200&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute bottom-12 left-12 right-12">
          <p className="text-white/60 text-sm leading-relaxed">
            "CARMA допомагає приймати обґрунтовані рішення щодо технічного обслуговування
            та покупки автомобілів"
          </p>
        </div>
      </div>
    </div>
  )
}
