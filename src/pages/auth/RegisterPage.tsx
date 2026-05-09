// Сторінка реєстрації нового користувача
// Після реєстрації Supabase автоматично створює запис в auth.users
// Тригер handle_new_user() в БД автоматично створить запис в profiles

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {

  // Стан всіх полів форми
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false) // показуємо після успішної реєстрації

  // Перевірка надійності пароля
  const passwordStrength = (() => {
    if (password.length === 0) return null
    if (password.length < 6) return 'weak'
    if (password.length < 10) return 'medium'
    return 'strong'
  })()

  const strengthColors: Record<string, string> = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500',
  }

  const strengthLabels: Record<string, string> = {
    weak: 'Слабкий',
    medium: 'Середній',
    strong: 'Надійний',
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Клієнтська валідація перед відправкою
    if (password !== confirmPassword) {
      setError('Паролі не співпадають')
      return
    }
    if (password.length < 6) {
      setError('Пароль має бути не менше 6 символів')
      return
    }
    if (!agreedToTerms) {
      setError('Погодьтеся з умовами використання')
      return
    }

    setLoading(true)

    // Реєстрація через Supabase Auth
    // full_name передаємо в user_metadata - він збережеться в auth.users
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName, // зберігається в auth.users.raw_user_meta_data
        },
      },
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        setError('Цей email вже зареєстрований')
      } else {
        setError('Помилка реєстрації. Спробуйте ще раз.')
      }
      setLoading(false)
      return
    }

    // Оновлюємо full_name в таблиці profiles (тригер вже створив запис)
    // Невелика затримка щоб тригер встиг спрацювати
    setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .update({ full_name: fullName })
          .eq('id', user.id)
      }
    }, 1000)

    setSuccess(true)
    setLoading(false)
  }

  // Екран успішної реєстрації
  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={28} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-light mb-3">Акаунт створено!</h2>
          <p className="text-white/40 text-sm mb-8 leading-relaxed">
            Ми надіслали лист підтвердження на <span className="text-white/70">{email}</span>.
            Перевірте пошту і підтвердьте акаунт.
          </p>
          <div className="flex flex-col gap-3 items-center">
            <Link
              to="/login"
              className="inline-block bg-white text-black px-8 py-3 text-sm font-medium hover:bg-white/90 transition-colors"
            >
              Перейти до входу
            </Link>
            <Link
              to="/"
              className="text-white/30 hover:text-white/60 text-xs transition-colors"
            >
              На головну →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex">

      {/* Ліва декоративна частина (прихована на мобільних) */}
      <div className="hidden lg:block flex-1 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-black/60" />

        {/* Переваги реєстрації */}
        <div className="absolute top-1/2 -translate-y-1/2 left-12 right-12">
          <p className="text-white/40 text-xs tracking-widest uppercase mb-6">Що ви отримаєте</p>
          <ul className="space-y-4">
            {[
              '1 автомобіль у гаражі безкоштовно',
              '1 AI-діагностика на місяць',
              '5 повідомлень AI-чату',
              'Перегляд маркетплейсу',
            ].map(benefit => (
              <li key={benefit} className="flex items-center gap-3 text-sm text-white/70">
                <div className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                  <Check size={11} className="text-white" />
                </div>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Права частина - форма реєстрації */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12 overflow-y-auto">

        {/* Назад */}
        <Link
          to="/"
          className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-12 transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          На головну
        </Link>

        {/* Шапка */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="text-white font-semibold tracking-widest text-sm uppercase">CARMA</span>
          </div>

          <h1 className="text-3xl font-light mb-2">Створити акаунт</h1>
          <p className="text-white/40 text-sm">Безкоштовно. Без кредитної картки.</p>
        </div>

        {/* Форма реєстрації */}
        <form onSubmit={handleRegister} className="space-y-5 max-w-sm">

          {/* Ім'я */}
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">
              Повне ім'я <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Іван Петренко"
              required
              minLength={2}
              className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-white/40 transition-colors placeholder:text-white/20"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">
              Email <span className="text-red-400">*</span>
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
              Пароль <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Мінімум 6 символів"
                required
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 pr-12 text-sm outline-none focus:border-white/40 transition-colors placeholder:text-white/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Індикатор надійності пароля */}
            {passwordStrength && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                  {['weak', 'medium', 'strong'].map((level, i) => (
                    <div
                      key={level}
                      className={`h-0.5 flex-1 rounded transition-colors ${
                        ['weak', 'medium', 'strong'].indexOf(passwordStrength) >= i
                          ? strengthColors[passwordStrength]
                          : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-white/30">{strengthLabels[passwordStrength]}</span>
              </div>
            )}
          </div>

          {/* Підтвердження пароля */}
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">
              Підтвердіть пароль <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Повторіть пароль"
                required
                className={`w-full bg-white/5 border text-white px-4 py-3 pr-12 text-sm outline-none transition-colors placeholder:text-white/20 ${
                  confirmPassword && password !== confirmPassword
                    ? 'border-red-500/50 focus:border-red-500'
                    : 'border-white/10 focus:border-white/40'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Згода з умовами */}
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => setAgreedToTerms(!agreedToTerms)}
              className={`w-5 h-5 border shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                agreedToTerms ? 'bg-white border-white' : 'border-white/20 hover:border-white/40'
              }`}
            >
              {agreedToTerms && <Check size={12} className="text-black" />}
            </button>
            <p className="text-white/40 text-xs leading-relaxed">
              Я погоджуюсь з{' '}
              <button type="button" className="text-white/70 hover:text-white underline transition-colors">
                умовами використання
              </button>{' '}
              та{' '}
              <button type="button" className="text-white/70 hover:text-white underline transition-colors">
                політикою конфіденційності
              </button>
            </p>
          </div>

          {/* Помилка */}
          {error && (
            <div className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Кнопка реєстрації */}
          <button
            type="submit"
            disabled={loading || !fullName.trim() || !email.trim() || !password || !confirmPassword || !agreedToTerms}
            className="w-full bg-white text-black py-3 text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Створення акаунту...' : 'Зареєструватись'}
          </button>
        </form>

        {/* Вже є акаунт */}
        <p className="text-white/30 text-sm mt-8">
          Вже є акаунт?{' '}
          <Link to="/login" className="text-white hover:text-white/70 transition-colors">
            Увійти
          </Link>
        </p>

        {/* Гостьовий режим */}
        <div className="mt-4">
          <Link
            to="/"
            className="text-white/20 hover:text-white/40 text-xs transition-colors"
          >
            Продовжити як гість →
          </Link>
        </div>
      </div>
    </div>
  )
}
