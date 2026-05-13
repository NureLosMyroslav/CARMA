// Головна сторінка маркетплейсу
// Тут відображаються всі активні оголошення, є пошук і фільтри
// Можна додавати авто в улюблені (тільки для авторизованих) і купувати

import { useEffect, useState } from 'react'
import { Search, SlidersHorizontal, Heart } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import CarCard from '@/components/marketplace/CarCard'
import OrderModal from '@/components/marketplace/OrderModal'
import AuthPromptModal from '@/components/ui/AuthPromptModal'
import { fetchActiveListings, fetchUserFavorites, toggleFavorite } from '@/lib/marketplace'
import type { ListingWithPhoto } from '@/lib/marketplace'
import { useAuth } from '@/contexts/AuthContext'

export default function MarketplacePage() {
  const { user } = useAuth()

  // Стан списку оголошень
  const [listings, setListings] = useState<ListingWithPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Улюблені зберігаємо як Set для швидкої перевірки has()
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  // Пошуковий рядок
  const [search, setSearch] = useState('')

  // Стан модальних вікон
  const [orderListing, setOrderListing] = useState<ListingWithPhoto | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authReason, setAuthReason] = useState<'favorites' | 'contact'>('favorites')

  // Завантажуємо оголошення при відкритті сторінки
  useEffect(() => {
    fetchActiveListings()
      .then(setListings)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  // Якщо юзер залогінений - підвантажуємо його улюблені
  useEffect(() => {
    if (!user) return
    fetchUserFavorites(user.id).then(ids => setFavorites(new Set(ids)))
  }, [user])

  const handleToggleFavorite = async (listingId: string) => {
    // Якщо не авторизований - показуємо запрошення залогінитись
    if (!user) {
      setAuthReason('favorites')
      setShowAuthModal(true)
      return
    }
    const isNowFavorited = await toggleFavorite(listingId, user.id)
    // Оновлюємо Set локально без перезавантаження
    setFavorites(prev => {
      const next = new Set(prev)
      isNowFavorited ? next.add(listingId) : next.delete(listingId)
      return next
    })
  }

  const handleBuy = (listing: ListingWithPhoto) => {
    setOrderListing(listing)
  }

  // Фільтруємо оголошення по пошуковому запиту
  // Шукаємо по марці, моделі, назві, року і місту
  const filtered = listings.filter(l => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      l.cars.make.toLowerCase().includes(q) ||
      l.cars.model.toLowerCase().includes(q) ||
      l.title.toLowerCase().includes(q) ||
      String(l.cars.year).includes(q) ||
      (l.city || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 pt-24 pb-20">

        {/* Заголовок сторінки */}
        <div className="mb-10">
          <p className="text-white/30 text-xs tracking-[0.3em] uppercase mb-3">Маркетплейс</p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-light">Автомобілі</h1>
              {/* Кількість результатів */}
              {!loading && (
                <p className="text-white/30 text-sm mt-1">
                  {filtered.length} {filtered.length === 1 ? 'оголошення' : 'оголошень'}
                </p>
              )}
            </div>

            {/* Лічильник улюблених */}
            {user && favorites.size > 0 && (
              <div className="flex items-center gap-2 text-white/40 text-sm">
                <Heart size={14} className="fill-red-500 text-red-500" />
                <span>{favorites.size} в улюблених</span>
              </div>
            )}
          </div>
        </div>

        {/* Рядок пошуку */}
        <div className="mb-8 flex gap-3">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Марка, модель, рік, місто..."
              className="w-full bg-white/5 border border-white/10 text-white pl-11 pr-4 py-3 text-sm outline-none focus:border-white/30 transition-colors placeholder:text-white/20"
            />
          </div>
          {/* Кнопка фільтрів (поки декоративна, TODO: додати фільтри) */}
          <button className="border border-white/10 px-4 text-white/40 hover:text-white hover:border-white/30 transition-colors flex items-center gap-2 text-sm">
            <SlidersHorizontal size={15} />
            <span className="hidden sm:inline">Фільтри</span>
          </button>
        </div>

        {/* Основний контент */}
        {loading ? (
          // Скелетон поки завантажуються дані
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/8 animate-pulse">
                <div className="aspect-[16/10] bg-white/5" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-white/5 rounded w-1/3" />
                  <div className="h-4 bg-white/5 rounded w-2/3" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                  <div className="h-8 bg-white/5 rounded mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          // Помилка завантаження
          <div className="text-center py-20">
            <p className="text-white/30 text-sm">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          // Нічого не знайдено
          <div className="text-center py-20">
            <p className="text-white/20 text-xs tracking-[0.3em] uppercase mb-3">Нічого не знайдено</p>
            <p className="text-white/30 text-sm">
              {search ? 'Спробуйте змінити пошуковий запит' : 'Оголошення скоро з\'являться'}
            </p>
            {search && (
              <button onClick={() => setSearch('')}
                className="mt-4 text-white/40 hover:text-white text-xs underline underline-offset-4 transition-colors">
                Скинути пошук
              </button>
            )}
          </div>
        ) : (
          // Сітка карток
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(listing => (
              <CarCard
                key={listing.id}
                listing={listing}
                isFavorited={favorites.has(listing.id)}
                onToggleFavorite={handleToggleFavorite}
                onBuy={handleBuy}
              />
            ))}
          </div>
        )}
      </div>

      {/* Модальні вікна */}
      <OrderModal listing={orderListing} onClose={() => setOrderListing(null)} />
      <AuthPromptModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        reason={authReason}
      />
    </div>
  )
}
