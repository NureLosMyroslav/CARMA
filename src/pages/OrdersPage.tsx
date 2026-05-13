// Сторінка "Мої заявки" - особистий кабінет користувача
// Тут юзер бачить всі свої заявки на купівлю авто і може скасувати активні

import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Clock, CheckCircle, XCircle, Car } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { getPhotoUrl } from '@/lib/marketplace'

// Тип одного замовлення з joined даними
interface OrderItem {
  id: string
  name: string
  phone: string
  status: string
  created_at: string
  listing_id: string
  listings: {
    id: string
    title: string
    price: number
    car_id: string
    cars: {
      make: string
      model: string
      year: number
    }
  }
  primaryPhotoUrl: string | null
}

// Конфіг для відображення статусів - іконка, колір, текст
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: 'В обробці',    color: 'text-yellow-400', icon: <Clock size={13} /> },
  confirmed: { label: 'Підтверджено', color: 'text-green-400',  icon: <CheckCircle size={13} /> },
  cancelled: { label: 'Скасовано',    color: 'text-white/30',   icon: <XCircle size={13} /> },
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  // Якщо не авторизований - редиректимо на логін
  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (!user) return
    loadOrders()
  }, [user])

  const loadOrders = async () => {
    setLoading(true)

    // Отримуємо замовлення разом з даними про оголошення і авто
    const { data, error } = await supabase
      .from('orders')
      .select(`*, listings(id, title, price, car_id, cars(make, model, year))`)
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })

    if (error || !data) { setLoading(false); return }

    // Окремим запитом тягнемо фото для всіх авто (щоб не робити N запитів)
    const carIds = data.map(o => o.listings?.car_id).filter(Boolean)
    const { data: photos } = await supabase
      .from('car_photos')
      .select('car_id, storage_path, is_primary')
      .in('car_id', carIds)

    // Будуємо map car_id -> url головного фото
    const photoMap: Record<string, string> = {}
    for (const p of photos || []) {
      if (!photoMap[p.car_id] || p.is_primary) photoMap[p.car_id] = p.storage_path
    }

    // Додаємо url фото до кожного замовлення
    setOrders(data.map(o => ({
      ...o,
      primaryPhotoUrl: o.listings?.car_id && photoMap[o.listings.car_id]
        ? getPhotoUrl(photoMap[o.listings.car_id])
        : null,
    })))
    setLoading(false)
  }

  const handleCancel = async (orderId: string) => {
    if (!confirm('Скасувати цей заказ?')) return
    setCancellingId(orderId)
    // Просто міняємо статус на 'cancelled' замість видалення
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o))
    setCancellingId(null)
  }

  // Розділяємо на активні і скасовані для зручності
  const activeOrders = orders.filter(o => o.status !== 'cancelled')
  const cancelledOrders = orders.filter(o => o.status === 'cancelled')

  if (authLoading || !user) return null

  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 pt-24 pb-20">

        {/* Шапка */}
        <div className="mb-10">
          <button onClick={() => navigate('/marketplace')}
            className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-8 transition-colors">
            <ArrowLeft size={14} />
            Маркетплейс
          </button>
          <p className="text-white/30 text-xs tracking-[0.3em] uppercase mb-2">Особистий кабінет</p>
          <h1 className="text-3xl font-light">Мої заявки</h1>
        </div>

        {loading ? (
          // Скелетон завантаження
          <div className="space-y-3">
            {[1,2].map(i => (
              <div key={i} className="h-24 bg-white/[0.02] border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          // Якщо замовлень немає
          <div className="text-center py-20 border border-dashed border-white/8">
            <Car size={28} className="text-white/10 mx-auto mb-4" />
            <p className="text-white/25 text-sm mb-4">У вас ще немає заявок</p>
            <Link to="/marketplace"
              className="text-white/40 hover:text-white text-xs underline underline-offset-4 transition-colors">
              Перейти до маркетплейсу →
            </Link>
          </div>
        ) : (
          <div className="space-y-8">

            {/* Активні замовлення */}
            {activeOrders.length > 0 && (
              <div>
                <p className="text-white/30 text-xs tracking-[0.25em] uppercase mb-4">
                  Активні ({activeOrders.length})
                </p>
                <div className="space-y-3">
                  {activeOrders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onCancel={handleCancel}
                      cancelling={cancellingId === order.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Скасовані замовлення (показуємо приглушено) */}
            {cancelledOrders.length > 0 && (
              <div>
                <p className="text-white/30 text-xs tracking-[0.25em] uppercase mb-4">
                  Скасовані ({cancelledOrders.length})
                </p>
                <div className="space-y-3 opacity-50">
                  {cancelledOrders.map(order => (
                    <OrderCard key={order.id} order={order} onCancel={handleCancel} cancelling={false} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Окремий компонент для одного рядка замовлення
function OrderCard({ order, onCancel, cancelling }: {
  order: OrderItem
  onCancel: (id: string) => void
  cancelling: boolean
}) {
  const st = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
  const car = order.listings?.cars
  const canCancel = order.status === 'pending'  // скасувати можна тільки якщо ще в обробці

  return (
    <div className="flex gap-4 border border-white/8 bg-white/[0.02] p-4 hover:border-white/15 transition-colors">

      {/* Фото авто */}
      <div className="w-20 h-16 flex-shrink-0 overflow-hidden bg-white/5">
        {order.primaryPhotoUrl ? (
          <img src={order.primaryPhotoUrl} className="w-full h-full object-cover" alt="" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car size={16} className="text-white/10" />
          </div>
        )}
      </div>

      {/* Інформація */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            {/* Назва авто */}
            {car ? (
              <p className="text-white text-sm font-medium">
                {car.make} {car.model} {car.year}
              </p>
            ) : (
              <p className="text-white/40 text-sm">Авто недоступне</p>
            )}
            {order.listings?.price && (
              <p className="text-white/40 text-xs mt-0.5">
                {order.listings.price.toLocaleString('uk-UA')} ₴
              </p>
            )}
          </div>

          {/* Статус замовлення */}
          <span className={`flex items-center gap-1 text-xs flex-shrink-0 ${st.color}`}>
            {st.icon}
            {st.label}
          </span>
        </div>

        <div className="flex items-center justify-between mt-2">
          {/* Дата створення */}
          <p className="text-white/25 text-xs">
            {new Date(order.created_at).toLocaleDateString('uk-UA', {
              day: 'numeric', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })}
          </p>

          {/* Кнопка скасувати (тільки для pending) */}
          {canCancel && (
            <button
              onClick={() => onCancel(order.id)}
              disabled={cancelling}
              className="text-white/30 hover:text-red-400 text-xs transition-colors disabled:opacity-40"
            >
              {cancelling ? 'Скасування...' : 'Скасувати'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
