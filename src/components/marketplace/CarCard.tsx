// Компонент картки автомобіля для сторінки маркетплейсу
// Відображає фото, назву, характеристики, ціну і кнопки дій

import { Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ListingWithPhoto } from '@/lib/marketplace'

interface Props {
  listing: ListingWithPhoto
  isFavorited: boolean
  onToggleFavorite: (id: string) => void
  onBuy: (listing: ListingWithPhoto) => void
}

export default function CarCard({ listing, isFavorited, onToggleFavorite, onBuy }: Props) {
  const car = listing.cars
  const navigate = useNavigate()

  return (
    <div
      className="bg-white/[0.02] border border-white/8 hover:border-white/20 transition-all duration-300 group flex flex-col cursor-pointer"
      onClick={() => navigate(`/marketplace/${listing.id}`)}
    >

      {/* Блок з фото */}
      <div className="relative aspect-[16/10] overflow-hidden bg-white/5 flex-shrink-0">
        {listing.primaryPhotoUrl ? (
          <img
            src={listing.primaryPhotoUrl}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          // Заглушка якщо фото немає
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-white/10 text-xs tracking-[0.3em] uppercase">Фото відсутнє</span>
          </div>
        )}

        {/* Кнопка додати в улюблені - зупиняємо propagation щоб не відкривало картку */}
        <button
          onClick={e => { e.stopPropagation(); onToggleFavorite(listing.id) }}
          className="absolute top-3 right-3 w-8 h-8 bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors"
        >
          <Heart
            size={14}
            className={isFavorited ? 'fill-red-500 text-red-500' : 'text-white/50 hover:text-white/80'}
          />
        </button>

        {/* Бейдж "Продано" якщо авто вже продане */}
        {listing.status === 'sold' && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white/60 text-xs tracking-[0.3em] uppercase border border-white/20 px-3 py-1">Продано</span>
          </div>
        )}
      </div>

      {/* Інформація про авто */}
      <div className="p-5 flex flex-col flex-1">
        <div className="mb-3 flex-1">
          {/* Рік і місто */}
          <p className="text-white/30 text-xs mb-1 tracking-wide">
            {car.year}{listing.city ? ` · ${listing.city}` : ''}
          </p>
          <h3 className="text-white font-medium text-base leading-snug">
            {car.make} {car.model}
          </h3>
          {/* Короткий опис (обрізаємо до 2 рядків) */}
          {listing.description && (
            <p className="text-white/35 text-xs mt-2 leading-relaxed line-clamp-2">
              {listing.description}
            </p>
          )}
        </div>

        {/* Характеристики: пробіг, пальне, коробка */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 mb-4">
          {[
            listing.mileage != null ? `${listing.mileage.toLocaleString('uk-UA')} км` : null,
            car.fuel_type,
            car.transmission,
          ].filter(Boolean).map((spec, i) => (
            <span key={i} className="text-white/35 text-xs">{spec}</span>
          ))}
        </div>

        {/* Ціна і кнопка купити */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div>
            <p className="text-white text-xl font-light">
              {listing.price.toLocaleString('uk-UA')}
              <span className="text-white/30 text-sm ml-1">₴</span>
            </p>
          </div>
          {/* stopPropagation щоб клік по кнопці не відкривав сторінку авто */}
          <button
            onClick={e => { e.stopPropagation(); onBuy(listing) }}
            disabled={listing.status === 'sold'}
            className="bg-white text-black text-xs font-medium px-5 py-2.5 hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Купити
          </button>
        </div>
      </div>
    </div>
  )
}
