import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { createCar, getCar, updateCar } from '@/lib/api/cars'
import type { CarInput } from '@/lib/api/cars'

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

interface SelectFieldProps {
  label: string
  value: string | number
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  children: React.ReactNode
}

function SelectField({ label, value, onChange, children }: SelectFieldProps) {
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
        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
      </div>
    </div>
  )
}

const EMPTY_FORM: CarInput = {
  make: '',
  model: '',
  year: 2020,
  mileage: 0,
  fuel_type: 'Бензин',
  transmission: 'Механіка',
}

export default function CarFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)

  const [form, setForm] = useState<CarInput>(EMPTY_FORM)
  const [mileageStr, setMileageStr] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: existingCar, isLoading } = useQuery({
    queryKey: ['car', id],
    queryFn: () => getCar(id!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (existingCar) {
      setForm({
        make: existingCar.make,
        model: existingCar.model,
        year: existingCar.year,
        mileage: existingCar.mileage,
        fuel_type: existingCar.fuel_type,
        transmission: existingCar.transmission,
      })
      setMileageStr(String(existingCar.mileage))
    }
  }, [existingCar])

  const saveMutation = useMutation({
    mutationFn: (input: CarInput) =>
      isEdit ? updateCar(id!, input) : createCar(input),
    onSuccess: (car) => {
      queryClient.invalidateQueries({ queryKey: ['cars'] })
      queryClient.invalidateQueries({ queryKey: ['car', car.id] })
      navigate(`/garage/${car.id}`)
    },
    onError: (err: Error) => {
      setError(err.message || 'Не вдалося зберегти')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const mileage = parseInt(mileageStr, 10)
    if (!form.make || !form.model.trim() || isNaN(mileage) || mileage < 0) {
      setError('Заповніть всі поля коректно')
      return
    }

    saveMutation.mutate({ ...form, mileage, model: form.model.trim() })
  }

  if (isEdit && isLoading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="w-px h-10 bg-white/20 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 pt-28 pb-20">

        <Link
          to={isEdit ? `/garage/${id}` : '/garage'}
          className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-8 transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Назад
        </Link>

        <div className="mb-12">
          <p className="text-white/40 text-xs tracking-[0.3em] uppercase mb-4">
            {isEdit ? 'Редагування' : 'Нове авто'}
          </p>
          <h1 className="text-3xl md:text-4xl font-light">
            {isEdit ? 'Оновити інформацію' : 'Додати автомобіль'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          <SelectField
            label="Марка"
            value={form.make}
            onChange={e => setForm(p => ({ ...p, make: e.target.value }))}
          >
            <option value="" disabled className="bg-black">Оберіть марку</option>
            {CAR_MAKES.map(m => (
              <option key={m} value={m} className="bg-black">{m}</option>
            ))}
          </SelectField>

          <div>
            <label className="block text-white/40 text-xs tracking-widest uppercase mb-2">Модель</label>
            <input
              type="text"
              value={form.model}
              onChange={e => setForm(p => ({ ...p, model: e.target.value }))}
              required
              placeholder="напр. Camry, 3 Series, Golf..."
              className="w-full bg-white/5 border border-white/10 text-white px-4 py-3.5 focus:outline-none focus:border-white/30 transition-colors text-sm placeholder:text-white/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Рік"
              value={form.year}
              onChange={e => setForm(p => ({ ...p, year: Number(e.target.value) }))}
            >
              {YEARS.map(y => (
                <option key={y} value={y} className="bg-black">{y}</option>
              ))}
            </SelectField>

            <div>
              <label className="block text-white/40 text-xs tracking-widest uppercase mb-2">Пробіг (км)</label>
              <input
                type="number"
                value={mileageStr}
                onChange={e => setMileageStr(e.target.value)}
                required
                min={0}
                max={9999999}
                placeholder="напр. 85000"
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3.5 focus:outline-none focus:border-white/30 transition-colors text-sm placeholder:text-white/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Тип палива"
              value={form.fuel_type}
              onChange={e => setForm(p => ({ ...p, fuel_type: e.target.value }))}
            >
              {FUEL_TYPES.map(f => (
                <option key={f} value={f} className="bg-black">{f}</option>
              ))}
            </SelectField>

            <SelectField
              label="Трансмісія"
              value={form.transmission}
              onChange={e => setForm(p => ({ ...p, transmission: e.target.value }))}
            >
              {TRANSMISSIONS.map(t => (
                <option key={t} value={t} className="bg-black">{t}</option>
              ))}
            </SelectField>
          </div>

          {error && (
            <div className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="w-full bg-white text-black py-4 text-sm font-medium tracking-wide hover:bg-white/90 transition-colors mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saveMutation.isPending
              ? 'Збереження...'
              : isEdit ? 'Зберегти зміни' : 'Додати авто'}
          </button>
        </form>
      </div>
    </div>
  )
}
