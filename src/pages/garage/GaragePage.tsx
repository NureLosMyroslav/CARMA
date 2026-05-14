import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Car as CarIcon, Gauge, Fuel, Settings2, ArrowRight } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { listCars } from '@/lib/api/cars'

function formatMileage(km: number): string {
  return km.toLocaleString('uk-UA') + ' км'
}

export default function GaragePage() {
  const { data: cars, isLoading, error } = useQuery({
    queryKey: ['cars'],
    queryFn: listCars,
  })

  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-20">

        <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
          <div>
            <p className="text-white/40 text-xs tracking-[0.3em] uppercase mb-4">Гараж</p>
            <h1 className="text-3xl md:text-4xl font-light">Ваші автомобілі</h1>
          </div>
          <Link
            to="/garage/new"
            className="bg-white text-black px-6 py-3 text-sm font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Додати авто
          </Link>
        </div>

        {isLoading && (
          <div className="text-white/40 text-sm">Завантаження...</div>
        )}

        {error && (
          <div className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            Не вдалося завантажити список авто
          </div>
        )}

        {cars && cars.length === 0 && (
          <div className="border border-white/10 p-16 text-center">
            <CarIcon size={32} className="text-white/20 mx-auto mb-6" />
            <h2 className="text-xl font-light mb-3">Гараж порожній</h2>
            <p className="text-white/40 text-sm mb-8 max-w-sm mx-auto">
              Додайте перший автомобіль щоб отримати персоналізовану AI-діагностику та аналітику
            </p>
            <Link
              to="/garage/new"
              className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-sm font-medium hover:bg-white/90 transition-colors"
            >
              <Plus size={16} />
              Додати перше авто
            </Link>
          </div>
        )}

        {cars && cars.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10">
            {cars.map(car => (
              <Link
                key={car.id}
                to={`/garage/${car.id}`}
                className="bg-black p-6 hover:bg-white/5 transition-colors duration-300 group"
              >
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="text-white/40 text-xs mb-1">{car.year}</p>
                    <h3 className="text-lg font-medium">{car.make} {car.model}</h3>
                  </div>
                  <CarIcon size={18} className="text-white/30 group-hover:text-white/60 transition-colors" />
                </div>

                <div className="space-y-2 text-xs text-white/50">
                  <div className="flex items-center gap-2">
                    <Gauge size={12} className="text-white/30" />
                    {formatMileage(car.mileage)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Fuel size={12} className="text-white/30" />
                    {car.fuel_type}
                  </div>
                  <div className="flex items-center gap-2">
                    <Settings2 size={12} className="text-white/30" />
                    {car.transmission}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/30 group-hover:text-white/60 transition-colors">
                  <span>Деталі</span>
                  <ArrowRight size={12} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
