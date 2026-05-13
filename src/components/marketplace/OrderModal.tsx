// Модальне вікно для оформлення заявки на купівлю авто
// Юзер вводить ім'я і телефон, ми надсилаємо в базу і показуємо успіх

import { useState } from 'react'
import { X, Clock, CheckCircle } from 'lucide-react'
import { createOrder } from '@/lib/marketplace'
import type { ListingWithPhoto } from '@/lib/marketplace'
import { useAuth } from '@/contexts/AuthContext'

interface Props {
  listing: ListingWithPhoto | null  // якщо null - модалка закрита
  onClose: () => void
}

export default function OrderModal({ listing, onClose }: Props) {
  const { user, profile } = useAuth()

  // Якщо юзер залогінений - підставляємо його дані в форму
  const [name, setName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Якщо немає активного оголошення - нічого не рендеримо
  if (!listing) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await createOrder({ listingId: listing.id, userId: user?.id, name, phone })
      setSuccess(true)  // показуємо екран успіху
    } catch {
      setError('Помилка при відправці. Спробуйте ще раз.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Темний фон - клік закриває модалку */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-md p-8">
        {/* Кнопка закрити */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        {success ? (
          // Екран успіху після відправки заявки
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-green-500/10 flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={24} className="text-green-400" />
            </div>
            <h3 className="text-white text-xl font-light mb-2">Заявку прийнято!</h3>
            <p className="text-white/40 text-sm leading-relaxed mb-6">
              Ми зв'яжемось з вами протягом{' '}
              <span className="text-white/70">5 хвилин</span>
            </p>
            {/* Робочі години */}
            <div className="flex items-center justify-center gap-2 text-white/25 text-xs border-t border-white/5 pt-5">
              <Clock size={11} />
              <span>Працюємо Пн–Пт з 9:00 до 18:00</span>
            </div>
          </div>
        ) : (
          // Форма заявки
          <>
            <p className="text-white/30 text-xs tracking-[0.3em] uppercase mb-1">Заявка на купівлю</p>
            <h3 className="text-white text-lg font-light mb-0.5">
              {listing.cars.make} {listing.cars.model} {listing.cars.year}
            </h3>
            <p className="text-white/50 text-sm mb-7">
              {listing.price.toLocaleString('uk-UA')} ₴
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">
                  Ваше ім'я
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Іван Петренко"
                  required
                  className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-white/40 transition-colors placeholder:text-white/20"
                />
              </div>

              <div>
                <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">
                  Телефон
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+380 XX XXX XX XX"
                  required
                  className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-white/40 transition-colors placeholder:text-white/20"
                />
              </div>

              {/* Показуємо помилку якщо щось пішло не так */}
              {error && (
                <div className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !name.trim() || !phone.trim()}
                className="w-full bg-white text-black py-3.5 text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Відправляємо...' : 'Залишити заявку'}
              </button>
            </form>

            {/* Нагадування про робочі години */}
            <div className="flex items-center justify-center gap-2 text-white/20 text-xs mt-5 pt-5 border-t border-white/5">
              <Clock size={11} />
              <span>Зв'яжемось протягом 5 хвилин · Пн–Пт 9:00–18:00</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
