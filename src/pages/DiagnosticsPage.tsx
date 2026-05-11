import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronDown, ArrowRight, Lock } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import type { CarInfo } from '@/lib/gemini'

const CAR_MAKES = [
  'Acura', 'Alfa Romeo', 'Audi', 'BMW', 'Chevrolet', 'Citroën', 'Dacia',
  'Fiat', 'Ford', 'Honda', 'Hyundai', 'Infiniti', 'Jeep', 'Kia', 'Lada',
  'Land Rover', 'Lexus', 'Mazda', 'Mercedes-Benz', 'Mitsubishi', 'Nissan',
  'Opel', 'Peugeot', 'Porsche', 'Renault', 'Seat', 'Skoda', 'Subaru',
  'Suzuki', 'Toyota', 'Volkswagen', 'Volvo', 'Daewoo', 'ZAZ',
].sort()

const YEARS = Array.from({ length: 2026 - 1990 + 1 }, (_, i) => 2026 - i)
const FUEL_TYPES = ['Бензин', 'Дизель', 'Гібрид', 'Електро', 'Газ (LPG)']
const TRANSMISSIONS = ['Механіка', 'Автомат', 'Варіатор', 'Робот']

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string | number
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-white/40 text-xs tracking-widest uppercase mb-2">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className="w-full bg-white/5 border border-white/10 text-white px-4 py-3.5 appearance-none focus:outline-none focus:border-white/30 transition-colors text-sm"
        >
          {children}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
        />
      </div>
    </div>
  )
}

export default function DiagnosticsPage() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    make: '',
    model: '',
    year: 2020,
    mileage: '',
    fuelType: 'Бензин',
    transmission: 'Механіка',
  })

  const set =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }))
    }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const car: CarInfo = {
      make: form.make,
      model: form.model,
      year: Number(form.year),
      mileage: Number(form.mileage),
      fuelType: form.fuelType,
      transmission: form.transmission,
    }
    navigate('/diagnostics/result', { state: { car } })
  }

  if (loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="w-px h-10 bg-white/20 animate-pulse" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="bg-black min-h-screen text-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center max-w-md px-6">
            <Lock size={32} className="text-white/20 mx-auto mb-6" />
            <h2 className="text-2xl font-light mb-4">Увійдіть для доступу</h2>
            <p className="text-white/50 mb-8 text-sm leading-relaxed">
              AI-діагностика доступна для авторизованих користувачів з Premium підпискою.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                to="/login"
                className="bg-white text-black px-6 py-3 text-sm font-medium hover:bg-white/90 transition-colors"
              >
                Увійти
              </Link>
              <Link
                to="/register"
                className="border border-white/30 text-white px-6 py-3 text-sm hover:border-white/60 transition-colors"
              >
                Реєстрація
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // TODO: розкоментувати коли буде система оплати
  // if (profile?.subscription_plan === 'free') { ... }

  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 pt-28 pb-20">
        <div className="mb-12">
          <p className="text-white/40 text-xs tracking-[0.3em] uppercase mb-4">AI-діагностика</p>
          <h1 className="text-3xl md:text-4xl font-light mb-4">Введіть дані автомобіля</h1>
          <p className="text-white/50 text-sm leading-relaxed">
            Gemini AI проаналізує потенційні проблеми на основі марки, моделі та пробігу вашого авто.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Make */}
          <SelectField label="Марка" value={form.make} onChange={set('make')}>
            <option value="" disabled className="bg-black">
              Оберіть марку
            </option>
            {CAR_MAKES.map(make => (
              <option key={make} value={make} className="bg-black">
                {make}
              </option>
            ))}
          </SelectField>

          {/* Model */}
          <div>
            <label className="block text-white/40 text-xs tracking-widest uppercase mb-2">
              Модель
            </label>
            <input
              type="text"
              value={form.model}
              onChange={set('model')}
              required
              placeholder="напр. Camry, 3 Series, Golf..."
              className="w-full bg-white/5 border border-white/10 text-white px-4 py-3.5 focus:outline-none focus:border-white/30 transition-colors text-sm placeholder:text-white/20"
            />
          </div>

          {/* Year + Mileage */}
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Рік" value={form.year} onChange={set('year')}>
              {YEARS.map(y => (
                <option key={y} value={y} className="bg-black">
                  {y}
                </option>
              ))}
            </SelectField>

            <div>
              <label className="block text-white/40 text-xs tracking-widest uppercase mb-2">
                Пробіг (км)
              </label>
              <input
                type="number"
                value={form.mileage}
                onChange={set('mileage')}
                required
                min={0}
                max={999999}
                placeholder="напр. 85 000"
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3.5 focus:outline-none focus:border-white/30 transition-colors text-sm placeholder:text-white/20"
              />
            </div>
          </div>

          {/* Fuel + Transmission */}
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Тип палива" value={form.fuelType} onChange={set('fuelType')}>
              {FUEL_TYPES.map(f => (
                <option key={f} value={f} className="bg-black">
                  {f}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Трансмісія"
              value={form.transmission}
              onChange={set('transmission')}
            >
              {TRANSMISSIONS.map(t => (
                <option key={t} value={t} className="bg-black">
                  {t}
                </option>
              ))}
            </SelectField>
          </div>

          <button
            type="submit"
            disabled={!form.make || !form.model || !form.mileage}
            className="w-full bg-white text-black py-4 text-sm font-medium tracking-wide hover:bg-white/90 transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Запустити AI-діагностику
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}
