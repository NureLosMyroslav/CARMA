// Форма для додавання і редагування оголошення (тільки для адміна)
// Дозволяє заповнити дані авто, завантажити до 4 фото і вибрати головне

import { useState, useRef } from 'react'
import { X, Upload, Star, Trash2 } from 'lucide-react'
import { createListing, updateListing, addPhotosToListing, deletePhoto, setPrimaryPhoto, getPhotoUrl } from '@/lib/marketplace'
import type { CreateListingData, ListingWithPhoto, CarPhoto } from '@/lib/marketplace'
import { useAuth } from '@/contexts/AuthContext'

// Тип для нового фото (ще не завантаженого в базу)
interface PhotoPreview {
  file: File
  previewUrl: string  // blob URL для попереднього перегляду
  isPrimary: boolean
}

interface Props {
  listing?: ListingWithPhoto & { allPhotos?: CarPhoto[] }  // якщо передано - режим редагування
  onClose: () => void
  onSaved: () => void
}

// Варіанти для dropdown полів
const FUEL_TYPES = ['Бензин', 'Дизель', 'Гібрид', 'Електро', 'Газ']
const TRANSMISSIONS = ['Механіка', 'Автомат', 'Варіатор', 'Робот']

export default function AdminCarForm({ listing, onClose, onSaved }: Props) {
  const { user } = useAuth()
  const isEdit = !!listing  // true якщо редагуємо, false якщо створюємо
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Стан полів форми - якщо редагування то підставляємо існуючі дані
  const [make, setMake] = useState(listing?.cars.make || '')
  const [model, setModel] = useState(listing?.cars.model || '')
  const [year, setYear] = useState(String(listing?.cars.year || new Date().getFullYear()))
  const [mileage, setMileage] = useState(String(listing?.mileage || ''))
  const [fuelType, setFuelType] = useState(listing?.cars.fuel_type || 'Бензин')
  const [transmission, setTransmission] = useState(listing?.cars.transmission || 'Механіка')
  const [title, setTitle] = useState(listing?.title || '')
  const [description, setDescription] = useState(listing?.description || '')
  const [price, setPrice] = useState(String(listing?.price || ''))
  const [city, setCity] = useState(listing?.city || '')
  const [region, setRegion] = useState(listing?.region || '')

  // Розділяємо фото на існуючі (в БД) і нові (ще не завантажені)
  const [newPhotos, setNewPhotos] = useState<PhotoPreview[]>([])
  const [existingPhotos, setExistingPhotos] = useState<CarPhoto[]>(listing?.allPhotos || [])
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<string[]>([])  // id фото які треба видалити при збереженні

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalPhotos = existingPhotos.length + newPhotos.length
  const canAddMore = totalPhotos < 4  // максимум 4 фото

  // ── Обробники фото ──────────────────────────────────────────────────────────

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const available = 4 - totalPhotos  // скільки ще можна додати
    const toAdd = files.slice(0, available)

    const previews: PhotoPreview[] = toAdd.map((file, i) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      // Перше фото стає головним якщо більше нема жодного
      isPrimary: existingPhotos.length === 0 && newPhotos.length === 0 && i === 0,
    }))

    setNewPhotos(prev => [...prev, ...previews])
    e.target.value = ''  // скидаємо input щоб можна було вибрати те саме фото знову
  }

  const removeNewPhoto = (idx: number) => {
    setNewPhotos(prev => {
      const updated = prev.filter((_, i) => i !== idx)
      // Якщо видалили головне - робимо наступне головним
      if (prev[idx].isPrimary && updated.length > 0) {
        updated[0].isPrimary = true
      }
      return updated
    })
  }

  // Встановити одне з нових фото як головне
  const setNewPrimary = (idx: number) => {
    setNewPhotos(prev => prev.map((p, i) => ({ ...p, isPrimary: i === idx })))
    setExistingPhotos(prev => prev.map(p => ({ ...p, is_primary: false })))  // знімаємо з існуючих
  }

  const removeExistingPhoto = (photo: CarPhoto) => {
    setDeletedPhotoIds(prev => [...prev, photo.id])  // запам'ятовуємо щоб видалити при збереженні
    setExistingPhotos(prev => prev.filter(p => p.id !== photo.id))
  }

  // Встановити одне з існуючих фото як головне
  const setExistingPrimary = (photo: CarPhoto) => {
    setExistingPhotos(prev => prev.map(p => ({ ...p, is_primary: p.id === photo.id })))
    setNewPhotos(prev => prev.map(p => ({ ...p, isPrimary: false })))  // знімаємо з нових
  }

  // ── Збереження форми ────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError(null)

    try {
      const data: CreateListingData = {
        make: make.trim(),
        model: model.trim(),
        year: Number(year),
        mileage: Number(mileage),
        fuelType,
        transmission,
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        city: city.trim(),
        region: region.trim(),
      }

      if (isEdit && listing) {
        // Режим редагування: оновлюємо дані, видаляємо помічені фото, додаємо нові
        await updateListing(listing.id, listing.car_id, data)

        for (const id of deletedPhotoIds) {
          const photo = listing.allPhotos?.find(p => p.id === id)
          if (photo) await deletePhoto(id, photo.storage_path)
        }

        // Оновлюємо головне фото якщо воно змінилось
        const primaryExisting = existingPhotos.find(p => p.is_primary)
        if (primaryExisting) await setPrimaryPhoto(listing.car_id, primaryExisting.id)

        if (newPhotos.length > 0) {
          await addPhotosToListing(listing.car_id, newPhotos)
        }
      } else {
        // Режим створення: все в одному запиті через createListing
        await createListing(user.id, data, newPhotos)
      }

      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка збереження')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-8 overflow-y-auto">
      {/* Фон - клік закриває форму */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-2xl my-auto">
        {/* Шапка форми */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/8">
          <div>
            <p className="text-white/30 text-xs tracking-[0.3em] uppercase">
              {isEdit ? 'Редагування' : 'Нове оголошення'}
            </p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">

          {/* Секція: дані авто */}
          <div>
            <p className="text-white/40 text-xs tracking-[0.25em] uppercase mb-4">Автомобіль</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/30 mb-1.5">Марка *</label>
                <input value={make} onChange={e => setMake(e.target.value)} required
                  placeholder="BMW" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-white/30 mb-1.5">Модель *</label>
                <input value={model} onChange={e => setModel(e.target.value)} required
                  placeholder="M5" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-white/30 mb-1.5">Рік *</label>
                <input type="number" value={year} onChange={e => setYear(e.target.value)} required
                  min="1990" max={new Date().getFullYear()} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-white/30 mb-1.5">Пробіг (км) *</label>
                <input type="number" value={mileage} onChange={e => setMileage(e.target.value)} required
                  min="0" placeholder="50000" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-white/30 mb-1.5">Пальне *</label>
                <select value={fuelType} onChange={e => setFuelType(e.target.value)} className={inputCls}>
                  {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/30 mb-1.5">Коробка *</label>
                <select value={transmission} onChange={e => setTransmission(e.target.value)} className={inputCls}>
                  {TRANSMISSIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Секція: дані оголошення */}
          <div>
            <p className="text-white/40 text-xs tracking-[0.25em] uppercase mb-4">Оголошення</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-white/30 mb-1.5">Заголовок *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} required
                  placeholder="BMW M5 Competition 2020" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/30 mb-1.5">Ціна (₴) *</label>
                  <input type="number" value={price} onChange={e => setPrice(e.target.value)} required
                    min="0" placeholder="1500000" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-white/30 mb-1.5">Місто</label>
                  <input value={city} onChange={e => setCity(e.target.value)}
                    placeholder="Київ" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-white/30 mb-1.5">Регіон</label>
                  <input value={region} onChange={e => setRegion(e.target.value)}
                    placeholder="Київська область" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/30 mb-1.5">Опис</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  rows={3} placeholder="Стан, комплектація, особливості..."
                  className={`${inputCls} resize-none`} />
              </div>
            </div>
          </div>

          {/* Секція: завантаження фото */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/40 text-xs tracking-[0.25em] uppercase">
                Фото ({totalPhotos}/4)
              </p>
              {canAddMore && (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-white/40 hover:text-white text-xs transition-colors">
                  <Upload size={12} />
                  Додати фото
                </button>
              )}
            </div>

            {/* Прихований input для вибору файлів */}
            <input ref={fileInputRef} type="file" multiple accept="image/*"
              onChange={handleFileSelect} className="hidden" />

            {totalPhotos === 0 ? (
              // Зона drop якщо фото ще немає
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-full border border-dashed border-white/15 hover:border-white/30 py-10 flex flex-col items-center gap-3 transition-colors">
                <Upload size={20} className="text-white/25" />
                <span className="text-white/25 text-xs tracking-wide">Клікніть щоб завантажити фото (до 4 шт.)</span>
              </button>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {/* Існуючі фото (при редагуванні) */}
                {existingPhotos.map(photo => (
                  <div key={photo.id} className="relative aspect-square group/photo">
                    <img src={getPhotoUrl(photo.storage_path)}
                      className="w-full h-full object-cover" alt="" />
                    {/* Зірочка для головного фото */}
                    {photo.is_primary && (
                      <div className="absolute top-1 left-1 bg-yellow-500 p-0.5 rounded-sm">
                        <Star size={8} className="text-black fill-black" />
                      </div>
                    )}
                    {/* При наведенні показуємо кнопки дій */}
                    <div className="absolute inset-0 bg-black/0 group-hover/photo:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover/photo:opacity-100">
                      {!photo.is_primary && (
                        <button type="button" onClick={() => setExistingPrimary(photo)}
                          className="p-1 bg-yellow-500/20 hover:bg-yellow-500/40 transition-colors rounded">
                          <Star size={11} className="text-yellow-400" />
                        </button>
                      )}
                      <button type="button" onClick={() => removeExistingPhoto(photo)}
                        className="p-1 bg-red-500/20 hover:bg-red-500/40 transition-colors rounded">
                        <Trash2 size={11} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Нові фото (ще не збережені) */}
                {newPhotos.map((photo, idx) => (
                  <div key={idx} className="relative aspect-square group/photo">
                    <img src={photo.previewUrl} className="w-full h-full object-cover" alt="" />
                    {photo.isPrimary && (
                      <div className="absolute top-1 left-1 bg-yellow-500 p-0.5 rounded-sm">
                        <Star size={8} className="text-black fill-black" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover/photo:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover/photo:opacity-100">
                      {!photo.isPrimary && (
                        <button type="button" onClick={() => setNewPrimary(idx)}
                          className="p-1 bg-yellow-500/20 hover:bg-yellow-500/40 transition-colors rounded">
                          <Star size={11} className="text-yellow-400" />
                        </button>
                      )}
                      <button type="button" onClick={() => removeNewPhoto(idx)}
                        className="p-1 bg-red-500/20 hover:bg-red-500/40 transition-colors rounded">
                        <Trash2 size={11} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Кнопка додати ще фото */}
                {canAddMore && (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border border-dashed border-white/15 hover:border-white/30 flex items-center justify-center transition-colors">
                    <Upload size={16} className="text-white/20" />
                  </button>
                )}
              </div>
            )}
            <p className="text-white/20 text-xs mt-2">
              <Star size={9} className="inline mr-1 text-yellow-500/60" />
              Наведіть на фото щоб обрати головне або видалити
            </p>
          </div>

          {/* Помилка */}
          {error && (
            <div className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Кнопки дій */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-white/15 text-white/60 py-3 text-sm hover:border-white/30 transition-colors">
              Скасувати
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-white text-black py-3 text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50">
              {loading ? 'Збереження...' : isEdit ? 'Зберегти зміни' : 'Опублікувати'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Загальні стилі для полів вводу (винесено щоб не дублювати)
const inputCls = 'w-full bg-white/5 border border-white/10 text-white px-4 py-2.5 text-sm outline-none focus:border-white/35 transition-colors placeholder:text-white/20 [&>option]:bg-[#0a0a0a]'
