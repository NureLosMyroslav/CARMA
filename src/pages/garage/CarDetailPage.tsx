import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Pencil, Trash2, Sparkles, Gauge, Fuel, Settings2, Calendar, X,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { deleteCar, getCar } from '@/lib/api/cars'

function formatMileage(km: number): string {
  return km.toLocaleString('uk-UA') + ' км'
}

interface DeleteModalProps {
  carName: string
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}

function DeleteModal({ carName, onConfirm, onCancel, isDeleting }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center px-6">
      <div className="bg-black border border-white/10 p-8 max-w-md w-full">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-white/40 text-xs tracking-[0.3em] uppercase mb-3">Підтвердження</p>
            <h3 className="text-xl font-light">Видалити авто?</h3>
          </div>
          <button onClick={onCancel} className="text-white/30 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <p className="text-white/50 text-sm leading-relaxed mb-8">
          <span className="text-white">{carName}</span> буде видалено з гаража назавжди.
          Цю дію не можна скасувати.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-white/20 text-white py-3 text-sm hover:border-white/40 transition-colors"
          >
            Скасувати
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 bg-red-500/20 border border-red-500/40 text-red-300 py-3 text-sm hover:bg-red-500/30 transition-colors disabled:opacity-40"
          >
            {isDeleting ? 'Видалення...' : 'Видалити'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CarDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const { data: car, isLoading, error } = useQuery({
    queryKey: ['car', id],
    queryFn: () => getCar(id!),
    enabled: Boolean(id),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteCar(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] })
      navigate('/garage')
    },
  })

  if (isLoading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="w-px h-10 bg-white/20 animate-pulse" />
      </div>
    )
  }

  if (error || !car) {
    return (
      <div className="bg-black min-h-screen text-white">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 pt-28 text-center">
          <p className="text-white/40 mb-6">Автомобіль не знайдено</p>
          <Link to="/garage" className="text-white underline">Повернутись до гаража</Link>
        </div>
      </div>
    )
  }

  const handleDiagnose = () => {
    navigate('/diagnostics', {
      state: {
        prefill: {
          make: car.make,
          model: car.model,
          year: car.year,
          mileage: car.mileage,
          fuelType: car.fuel_type,
          transmission: car.transmission,
        },
        fromCarId: car.id,
      },
    })
  }

  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 pt-28 pb-20">

        <Link
          to="/garage"
          className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-8 transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Гараж
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-12">
          <div>
            <p className="text-white/40 text-xs tracking-[0.3em] uppercase mb-4">{car.year}</p>
            <h1 className="text-4xl md:text-5xl font-light">{car.make} {car.model}</h1>
          </div>

          <div className="flex gap-2">
            <Link
              to={`/garage/${car.id}/edit`}
              className="flex items-center gap-2 border border-white/20 px-4 py-2.5 text-sm hover:border-white/40 transition-colors"
            >
              <Pencil size={14} />
              Редагувати
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 border border-white/10 text-white/50 px-4 py-2.5 text-sm hover:border-red-500/40 hover:text-red-300 transition-colors"
            >
              <Trash2 size={14} />
              Видалити
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10 mb-12">
          <div className="bg-black p-6">
            <div className="flex items-center gap-3 text-white/40 text-xs tracking-widest uppercase mb-3">
              <Calendar size={14} />
              Рік випуску
            </div>
            <p className="text-2xl font-light">{car.year}</p>
          </div>

          <div className="bg-black p-6">
            <div className="flex items-center gap-3 text-white/40 text-xs tracking-widest uppercase mb-3">
              <Gauge size={14} />
              Пробіг
            </div>
            <p className="text-2xl font-light">{formatMileage(car.mileage)}</p>
          </div>

          <div className="bg-black p-6">
            <div className="flex items-center gap-3 text-white/40 text-xs tracking-widest uppercase mb-3">
              <Fuel size={14} />
              Тип палива
            </div>
            <p className="text-2xl font-light">{car.fuel_type}</p>
          </div>

          <div className="bg-black p-6">
            <div className="flex items-center gap-3 text-white/40 text-xs tracking-widest uppercase mb-3">
              <Settings2 size={14} />
              Трансмісія
            </div>
            <p className="text-2xl font-light">{car.transmission}</p>
          </div>
        </div>

        <div className="border border-white/10 p-8 md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-md">
              <p className="text-white/40 text-xs tracking-[0.3em] uppercase mb-3">AI-діагностика</p>
              <h2 className="text-xl font-light mb-2">Проаналізувати стан авто</h2>
              <p className="text-white/50 text-sm leading-relaxed">
                Gemini AI оцінить потенційні проблеми вашого {car.make} {car.model} на основі року та пробігу.
              </p>
            </div>

            <button
              onClick={handleDiagnose}
              className="bg-white text-black px-6 py-3 text-sm font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
            >
              <Sparkles size={16} />
              Запустити
            </button>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteModal
          carName={`${car.make} ${car.model}`}
          onConfirm={() => deleteMutation.mutate()}
          onCancel={() => setShowDeleteModal(false)}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  )
}
