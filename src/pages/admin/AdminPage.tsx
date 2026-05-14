// Адмін панель - доступна тільки для користувачів з role='admin'
// Тут можна керувати оголошеннями (додавати, редагувати, видаляти)
// і обробляти заявки від покупців (підтверджувати або скасовувати)

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Car, ClipboardList, CheckCircle, XCircle, Clock, Phone, User } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import AdminCarForm from '@/components/admin/AdminCarForm'
import { fetchAllListings, deleteListing, getPhotoUrl } from '@/lib/marketplace'
import type { ListingWithPhoto, CarPhoto } from '@/lib/marketplace'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

// ─── Типи ──────────────────────────────────────────────────────────────────

// Замовлення з joined даними для адмін-панелі
interface AdminOrder {
  id: string
  name: string
  phone: string
  status: string
  created_at: string
  listing_id: string
  user_id: string | null
  listings: {
    title: string
    price: number
    car_id: string
    cars: { make: string; model: string; year: number }
  }
  primaryPhotoUrl: string | null
}

// Конфіг відображення статусів для таблиці заявок
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending:   { label: 'В обробці',    color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: <Clock size={12} /> },
  confirmed: { label: 'Підтверджено', color: 'text-green-400',  bg: 'bg-green-500/10',  icon: <CheckCircle size={12} /> },
  cancelled: { label: 'Скасовано',    color: 'text-white/30',   bg: 'bg-white/5',        icon: <XCircle size={12} /> },
}

// ─── Головний компонент ─────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Активна вкладка - оголошення або заявки
  const [tab, setTab] = useState<'listings' | 'orders'>('listings')

  // Стан для вкладки оголошень
  const [listings, setListings] = useState<ListingWithPhoto[]>([])
  const [listingsLoading, setListingsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editListing, setEditListing] = useState<(ListingWithPhoto & { allPhotos?: CarPhoto[] }) | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Стан для вкладки заявок
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)  // лічильник нових заявок для бейджу

  // Перевіряємо що юзер - адмін, якщо ні - редиректимо на головну
  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== 'admin')) navigate('/')
  }, [user, profile, authLoading, navigate])

  // Завантажуємо дані тільки якщо точно адмін
  useEffect(() => {
    if (profile?.role !== 'admin') return
    loadListings()
    loadOrders()
  }, [profile])

  // ── Оголошення ──────────────────────────────────────────────────────────────

  const loadListings = async () => {
    setListingsLoading(true)
    try { setListings(await fetchAllListings()) }
    finally { setListingsLoading(false) }
  }

  // При кліку на редагувати - додатково підвантажуємо всі фото оголошення
  const handleEdit = async (listing: ListingWithPhoto) => {
    const { data: photos } = await supabase
      .from('car_photos').select('*').eq('car_id', listing.car_id).order('is_primary', { ascending: false })
    setEditListing({ ...listing, allPhotos: photos || [] })
    setShowForm(true)
  }

  const handleDeleteListing = async (listing: ListingWithPhoto) => {
    if (!confirm(`Видалити "${listing.title}"? Це незворотня дія.`)) return
    setDeletingId(listing.id)
    try {
      await deleteListing(listing.id, listing.car_id)
      setListings(prev => prev.filter(l => l.id !== listing.id))
    } finally { setDeletingId(null) }
  }

  // ── Заявки ────────────────────────────────────────────────────────────────

  const loadOrders = async () => {
    setOrdersLoading(true)

    // Отримуємо всі заявки з даними про оголошення і авто
    const { data } = await supabase
      .from('orders')
      .select('*, listings(title, price, car_id, cars(make, model, year))')
      .order('created_at', { ascending: false })

    if (!data) { setOrdersLoading(false); return }

    // Підтягуємо фото для всіх авто одним запитом
    const carIds = data.map(o => o.listings?.car_id).filter(Boolean)
    const { data: photos } = await supabase
      .from('car_photos').select('car_id, storage_path, is_primary').in('car_id', carIds)

    const photoMap: Record<string, string> = {}
    for (const p of photos || []) {
      if (!photoMap[p.car_id] || p.is_primary) photoMap[p.car_id] = p.storage_path
    }

    const result = data.map(o => ({
      ...o,
      primaryPhotoUrl: o.listings?.car_id && photoMap[o.listings.car_id]
        ? getPhotoUrl(photoMap[o.listings.car_id]) : null,
    }))
    setOrders(result)
    // Рахуємо скільки нових заявок для бейджу на вкладці
    setPendingCount(result.filter(o => o.status === 'pending').length)
    setOrdersLoading(false)
  }

  // Змінити статус заявки (підтвердити або скасувати)
  const updateOrderStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    // Перераховуємо pending лічильник
    setPendingCount(prev => status === 'pending' ? prev + 1 : Math.max(0, prev - 1))
  }

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Видалити цю заявку?')) return
    await supabase.from('orders').delete().eq('id', orderId)
    setOrders(prev => {
      const order = prev.find(o => o.id === orderId)
      if (order?.status === 'pending') setPendingCount(c => Math.max(0, c - 1))
      return prev.filter(o => o.id !== orderId)
    })
  }

  // Поки перевіряємо авторизацію або якщо не адмін - нічого не рендеримо
  if (authLoading || profile?.role !== 'admin') return null

  // Підраховуємо статистику для блоку зверху
  const stats = {
    total: listings.length,
    active: listings.filter(l => l.status === 'active').length,
    sold: listings.filter(l => l.status === 'sold').length,
  }

  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 pt-24 pb-20">

        {/* Шапка з кнопкою додати */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-white/30 text-xs tracking-[0.3em] uppercase mb-2">Панель керування</p>
            <h1 className="text-3xl font-light">Адмін</h1>
          </div>
          {tab === 'listings' && (
            <button
              onClick={() => { setEditListing(null); setShowForm(true) }}
              className="flex items-center gap-2 bg-white text-black px-5 py-2.5 text-sm font-medium hover:bg-white/90 transition-colors"
            >
              <Plus size={15} />
              Додати авто
            </button>
          )}
        </div>

        {/* Блок статистики */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Оголошень',  value: stats.total },
            { label: 'Активних',   value: stats.active },
            { label: 'Продано',    value: stats.sold },
            { label: 'Заявок',     value: orders.length, badge: pendingCount },
          ].map(stat => (
            <div key={stat.label} className="border border-white/8 p-5 bg-white/[0.02]">
              <p className="text-white/30 text-xs tracking-widest uppercase mb-1">{stat.label}</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-light">{stat.value}</p>
                {/* Бейдж з кількістю нових заявок */}
                {stat.badge ? (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {stat.badge} нових
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {/* Вкладки навігації */}
        <div className="flex gap-1 mb-6 border-b border-white/8">
          {([
            { key: 'listings', label: 'Оголошення', icon: <Car size={13} />, badge: 0 },
            { key: 'orders',   label: 'Заявки',     icon: <ClipboardList size={13} />, badge: pendingCount },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm transition-colors relative ${
                tab === t.key ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t.icon}
              {t.label}
              {t.badge ? (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {t.badge}
                </span>
              ) : null}
              {/* Лінія під активною вкладкою */}
              {tab === t.key && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-white" />
              )}
            </button>
          ))}
        </div>

        {/* ── Вкладка: оголошення ── */}
        {tab === 'listings' && (
          listingsLoading ? (
            // Скелетон завантаження
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-white/[0.02] border border-white/5 animate-pulse" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            // Порожній стан
            <div className="text-center py-20 border border-dashed border-white/10">
              <Car size={32} className="text-white/10 mx-auto mb-4" />
              <p className="text-white/30 text-sm">Оголошень ще немає</p>
              <button onClick={() => { setEditListing(null); setShowForm(true) }}
                className="mt-4 text-white/40 hover:text-white text-xs underline underline-offset-4 transition-colors">
                Додати перше авто →
              </button>
            </div>
          ) : (
            // Список оголошень
            <div className="space-y-2">
              {listings.map(listing => (
                <div key={listing.id}
                  className="flex items-center gap-4 border border-white/8 bg-white/[0.02] px-4 py-3 hover:border-white/15 transition-colors">
                  {/* Мініатюра */}
                  <div className="w-14 h-10 flex-shrink-0 bg-white/5 overflow-hidden">
                    {listing.primaryPhotoUrl
                      ? <img src={listing.primaryPhotoUrl} className="w-full h-full object-cover" alt="" />
                      : <div className="w-full h-full flex items-center justify-center"><Car size={14} className="text-white/15" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{listing.title}</p>
                    <p className="text-white/30 text-xs">
                      {listing.cars.year} · {listing.cars.fuel_type} · {listing.cars.transmission}
                      {listing.city ? ` · ${listing.city}` : ''}
                    </p>
                  </div>
                  <p className="text-white/70 text-sm flex-shrink-0">{listing.price.toLocaleString('uk-UA')} ₴</p>
                  {/* Статус оголошення */}
                  <span className={`text-xs px-2 py-0.5 flex-shrink-0 ${
                    listing.status === 'active' ? 'bg-green-500/10 text-green-400'
                    : listing.status === 'sold' ? 'bg-white/5 text-white/30'
                    : 'bg-yellow-500/10 text-yellow-400'}`}>
                    {listing.status === 'active' ? 'Активне' : listing.status === 'sold' ? 'Продано' : listing.status || '—'}
                  </span>
                  {/* Кнопки редагувати і видалити */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleEdit(listing)}
                      className="p-2 text-white/30 hover:text-white transition-colors" title="Редагувати">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDeleteListing(listing)} disabled={deletingId === listing.id}
                      className="p-2 text-white/30 hover:text-red-400 transition-colors disabled:opacity-40" title="Видалити">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Вкладка: заявки ── */}
        {tab === 'orders' && (
          ordersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-white/[0.02] border border-white/5 animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-white/10">
              <ClipboardList size={32} className="text-white/10 mx-auto mb-4" />
              <p className="text-white/30 text-sm">Заявок ще немає</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => {
                const st = STATUS_CFG[order.status] || STATUS_CFG.pending
                const car = order.listings?.cars
                return (
                  <div key={order.id}
                    className="flex gap-4 border border-white/8 bg-white/[0.02] p-4 hover:border-white/15 transition-colors">

                    {/* Фото авто */}
                    <div className="w-20 h-16 flex-shrink-0 overflow-hidden bg-white/5">
                      {order.primaryPhotoUrl
                        ? <img src={order.primaryPhotoUrl} className="w-full h-full object-cover" alt="" />
                        : <div className="w-full h-full flex items-center justify-center"><Car size={14} className="text-white/10" /></div>}
                    </div>

                    {/* Інформація про авто і клієнта */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-white text-sm font-medium">
                          {car ? `${car.make} ${car.model} ${car.year}` : '—'}
                        </p>
                        {/* Бейдж статусу */}
                        <span className={`flex items-center gap-1 text-xs flex-shrink-0 px-2 py-0.5 ${st.bg} ${st.color}`}>
                          {st.icon}{st.label}
                        </span>
                      </div>

                      {order.listings?.price && (
                        <p className="text-white/35 text-xs mb-2">{order.listings.price.toLocaleString('uk-UA')} ₴</p>
                      )}

                      {/* Контактні дані клієнта */}
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-1.5 text-white/50 text-xs">
                          <User size={11} />
                          {order.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-white/50 text-xs">
                          <Phone size={11} />
                          {order.phone}
                        </div>
                        <div className="text-white/25 text-xs">
                          {new Date(order.created_at).toLocaleDateString('uk-UA', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Кнопки дій з заявкою */}
                    <div className="flex flex-col gap-1.5 flex-shrink-0 justify-center">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'confirmed')}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                        >
                          <CheckCircle size={11} />
                          Підтвердити
                        </button>
                      )}
                      {order.status !== 'cancelled' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
                        >
                          <XCircle size={11} />
                          Скасувати
                        </button>
                      )}
                      <button
                        onClick={() => deleteOrder(order.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/20 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={11} />
                        Видалити
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>

      {/* Модальна форма для додавання/редагування авто */}
      {showForm && (
        <AdminCarForm
          listing={editListing || undefined}
          onClose={() => { setShowForm(false); setEditListing(null) }}
          onSaved={() => { setShowForm(false); setEditListing(null); loadListings() }}
        />
      )}
    </div>
  )
}
