import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, ChevronLeft, ChevronRight, MapPin, Gauge, Fuel, Settings, Maximize2, X } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import OrderModal from '@/components/marketplace/OrderModal'
import AuthPromptModal from '@/components/ui/AuthPromptModal'
import { fetchListingById, toggleFavorite, fetchUserFavorites, getPhotoUrl } from '@/lib/marketplace'
import type { ListingWithPhoto, CarPhoto } from '@/lib/marketplace'
import { useAuth } from '@/contexts/AuthContext'

// Тип для сторінки деталей - оголошення з усіма фото
type FullListing = ListingWithPhoto & { allPhotos: CarPhoto[] }

// ─── Lightbox (повноекранний перегляд фото з зумом) ──────────────────────────

// Межі зуму: від 1x до 4x
const MIN_ZOOM = 1
const MAX_ZOOM = 4

function Lightbox({ urls, startIdx, onClose }: {
  urls: string[]
  startIdx: number
  onClose: () => void
}) {
  const [idx, setIdx] = useState(startIdx)

  // Стан зуму і зміщення для панорамування
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)

  // Зберігаємо початкову точку drag щоб рахувати зміщення
  const dragStart = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // При зміні фото скидаємо зум і позицію
  useEffect(() => {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }, [idx])

  const resetZoom = () => {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }

  // Перехід до попереднього фото (тільки якщо не в режимі зуму)
  const prev = useCallback(() => {
    if (zoom > 1) return
    setIdx(i => (i - 1 + urls.length) % urls.length)
  }, [urls.length, zoom])

  // Перехід до наступного фото (тільки якщо не в режимі зуму)
  const next = useCallback(() => {
    if (zoom > 1) return
    setIdx(i => (i + 1) % urls.length)
  }, [urls.length, zoom])

  // Clamp offset so image never goes too far out
  const clampOffset = useCallback((ox: number, oy: number, z: number) => {
    if (!containerRef.current) return { x: ox, y: oy }
    const rect = containerRef.current.getBoundingClientRect()
    const maxX = (rect.width  * (z - 1)) / 2
    const maxY = (rect.height * (z - 1)) / 2
    return {
      x: Math.min(maxX, Math.max(-maxX, ox)),
      y: Math.min(maxY, Math.max(-maxY, oy)),
    }
  }, [])

  // Зум колесом миші - збільшуємо або зменшуємо на 0.3 за один scroll
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.3 : 0.3
    setZoom(z => {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta))
      // При поверненні до 1x - скидаємо позицію
      if (next === MIN_ZOOM) setOffset({ x: 0, y: 0 })
      else setOffset(o => clampOffset(o.x, o.y, next))
      return next
    })
  }, [clampOffset])

  // Подвійний клік - переключає між 1x і 2x
  const handleDoubleClick = useCallback(() => {
    if (zoom > 1) {
      resetZoom()
    } else {
      setZoom(2)
    }
  }, [zoom])

  // Затиснути і тягти для панорамування (тільки коли є зум)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return
    e.preventDefault()
    setDragging(true)
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y }
  }, [zoom, offset])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !dragStart.current) return
    const dx = e.clientX - dragStart.current.mx
    const dy = e.clientY - dragStart.current.my
    const clamped = clampOffset(dragStart.current.ox + dx, dragStart.current.oy + dy, zoom)
    setOffset(clamped)
  }, [dragging, zoom, clampOffset])

  const handleMouseUp = useCallback(() => {
    setDragging(false)
    dragStart.current = null
  }, [])

  // Touch-підтримка для мобільних (один палець - панорамування)
  const touchStart = useRef<{ tx: number; ty: number; ox: number; oy: number } | null>(null)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (zoom <= 1 || e.touches.length !== 1) return
    const t = e.touches[0]
    touchStart.current = { tx: t.clientX, ty: t.clientY, ox: offset.x, oy: offset.y }
  }, [zoom, offset])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current || e.touches.length !== 1) return
    e.preventDefault()
    const t = e.touches[0]
    const dx = t.clientX - touchStart.current.tx
    const dy = t.clientY - touchStart.current.ty
    const clamped = clampOffset(touchStart.current.ox + dx, touchStart.current.oy + dy, zoom)
    setOffset(clamped)
  }, [zoom, clampOffset])

  const handleTouchEnd = useCallback(() => {
    touchStart.current = null
  }, [])

  // Клавіатурна навігація - стрілки і Esc
  // Esc спочатку скидає зум, і тільки потім закриває лайтбокс
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape') {
        if (zoom > 1) resetZoom()
        else onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prev, next, onClose, zoom])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const isZoomed = zoom > 1

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col select-none">

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-white/40 text-sm">
            {idx + 1} / {urls.length}
          </span>
          {/* Zoom indicator */}
          {isZoomed && (
            <button
              onClick={resetZoom}
              className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white bg-white/10 hover:bg-white/15 px-2.5 py-1 transition-colors"
            >
              <span className="font-medium">{zoom.toFixed(1)}×</span>
              <span className="text-white/35">скинути</span>
            </button>
          )}
          {!isZoomed && (
            <span className="text-white/20 text-xs">прокрути або двічі клацни щоб наблизити</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors rounded"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main image area */}
      <div
        ref={containerRef}
        className="flex-1 relative flex items-center justify-center overflow-hidden"
        style={{ cursor: isZoomed ? (dragging ? 'grabbing' : 'grab') : 'zoom-in' }}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          key={idx}
          src={urls[idx]}
          alt=""
          className="max-w-full max-h-full object-contain transition-none"
          style={{
            transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
            transition: dragging ? 'none' : 'transform 0.15s ease',
            pointerEvents: 'none',
          }}
          draggable={false}
        />

        {/* Nav arrows — only when not zoomed */}
        {!isZoomed && urls.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails strip — hidden when zoomed */}
      {!isZoomed && urls.length > 1 && (
        <div className="flex-shrink-0 flex gap-2 justify-center px-6 py-4 overflow-x-auto" onWheel={e => e.stopPropagation()}>
          {urls.map((url, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`flex-shrink-0 w-16 h-12 overflow-hidden transition-all ${
                i === idx ? 'ring-1 ring-white opacity-100' : 'opacity-35 hover:opacity-60'
              }`}
            >
              <img src={url} className="w-full h-full object-cover" alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function CarDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [listing, setListing] = useState<FullListing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activeIdx, setActiveIdx] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [showOrder, setShowOrder] = useState(false)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    if (!id) return
    fetchListingById(id)
      .then(data => {
        setListing(data)
        const primaryIdx = data.allPhotos.findIndex(p => p.is_primary)
        setActiveIdx(primaryIdx >= 0 ? primaryIdx : 0)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!user || !id) return
    fetchUserFavorites(user.id).then(ids => setFavorited(ids.includes(id)))
  }, [user, id])

  const handleToggleFavorite = async () => {
    if (!user) { setShowAuth(true); return }
    if (!listing) return
    setFavorited(await toggleFavorite(listing.id, user.id))
  }

  const photos = listing?.allPhotos || []
  const photoUrls = photos.map(p => getPhotoUrl(p.storage_path))

  const prev = () => setActiveIdx(i => (i - 1 + photoUrls.length) % photoUrls.length)
  const next = () => setActiveIdx(i => (i + 1) % photoUrls.length)

  if (loading) {
    return (
      <div className="bg-black min-h-screen text-white">
        <Navbar />
        <div className="max-w-6xl mx-auto px-6 pt-24">
          <div className="aspect-[16/9] bg-white/[0.03] animate-pulse mb-6" />
          <div className="h-6 bg-white/[0.03] animate-pulse w-1/3 mb-3" />
          <div className="h-4 bg-white/[0.03] animate-pulse w-1/4" />
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="bg-black min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/40 text-sm mb-4">{error || 'Оголошення не знайдено'}</p>
          <button onClick={() => navigate('/marketplace')}
            className="text-white/40 hover:text-white text-xs underline underline-offset-4 transition-colors">
            Повернутись до маркетплейсу
          </button>
        </div>
      </div>
    )
  }

  const car = listing.cars
  const specs = [
    { icon: <Settings size={14} />, label: 'Коробка', value: car.transmission },
    { icon: <Fuel size={14} />,     label: 'Пальне',  value: car.fuel_type },
    { icon: <Gauge size={14} />,    label: 'Пробіг',  value: listing.mileage ? `${listing.mileage.toLocaleString('uk-UA')} км` : '—' },
    { icon: null,                   label: 'Рік',     value: String(car.year) },
  ]

  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 pt-24 pb-20">

        <button onClick={() => navigate('/marketplace')}
          className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft size={14} />
          Маркетплейс
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* ── Gallery ── */}
          <div>
            {/* Main photo */}
            <div
              className="relative aspect-[4/3] bg-white/[0.03] overflow-hidden mb-3 group cursor-zoom-in"
              onClick={() => photoUrls.length > 0 && setLightboxOpen(true)}
            >
              {photoUrls.length > 0 ? (
                <>
                  <img
                    key={activeIdx}
                    src={photoUrls[activeIdx]}
                    alt={listing.title}
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />

                  {/* Expand icon */}
                  <div className="absolute top-3 left-3 w-8 h-8 bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 size={14} className="text-white/80" />
                  </div>

                  {/* Photo counter */}
                  {photoUrls.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 text-white/70 text-xs">
                      {activeIdx + 1} / {photoUrls.length}
                    </div>
                  )}

                  {photoUrls.length > 1 && (
                    <>
                      <button
                        onClick={e => { e.stopPropagation(); prev() }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); next() }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white/10 text-xs tracking-[0.3em] uppercase">Фото відсутнє</span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {photoUrls.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {photoUrls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    className={`aspect-[4/3] overflow-hidden transition-all ${
                      i === activeIdx ? 'ring-1 ring-white opacity-100' : 'opacity-45 hover:opacity-70'
                    }`}
                  >
                    <img src={url} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            )}

            {photoUrls.length > 0 && (
              <button
                onClick={() => setLightboxOpen(true)}
                className="mt-3 flex items-center gap-2 text-white/30 hover:text-white/60 text-xs transition-colors"
              >
                <Maximize2 size={12} />
                Переглянути всі фото на повний екран
              </button>
            )}
          </div>

          {/* ── Info ── */}
          <div className="flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <p className="text-white/30 text-xs tracking-wide mb-1">
                  {car.year}{listing.city ? ` · ${listing.city}` : ''}{listing.region ? `, ${listing.region}` : ''}
                </p>
                <h1 className="text-2xl md:text-3xl font-light">{car.make} {car.model}</h1>
              </div>
              <button onClick={handleToggleFavorite}
                className="w-10 h-10 border border-white/15 flex items-center justify-center hover:border-white/35 transition-colors flex-shrink-0 mt-1">
                <Heart size={16} className={favorited ? 'fill-red-500 text-red-500' : 'text-white/40'} />
              </button>
            </div>

            {(listing.city || listing.region) && (
              <div className="flex items-center gap-1.5 text-white/30 text-xs mb-6">
                <MapPin size={11} />
                <span>{[listing.city, listing.region].filter(Boolean).join(', ')}</span>
              </div>
            )}

            <div className="py-5 border-t border-b border-white/8 mb-6">
              <p className="text-4xl font-light">
                {listing.price.toLocaleString('uk-UA')}
                <span className="text-white/30 text-xl ml-2">₴</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {specs.map(spec => (
                <div key={spec.label} className="bg-white/[0.03] border border-white/8 px-4 py-3">
                  <p className="text-white/30 text-xs mb-1 flex items-center gap-1.5">
                    {spec.icon}{spec.label}
                  </p>
                  <p className="text-white text-sm font-medium">{spec.value}</p>
                </div>
              ))}
            </div>

            {listing.description && (
              <div className="mb-8">
                <p className="text-white/30 text-xs tracking-[0.25em] uppercase mb-3">Опис</p>
                <p className="text-white/60 text-sm leading-relaxed whitespace-pre-line">{listing.description}</p>
              </div>
            )}

            <div className="mt-auto">
              <button
                onClick={() => setShowOrder(true)}
                disabled={listing.status === 'sold'}
                className="w-full bg-white text-black py-4 text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {listing.status === 'sold' ? 'Продано' : 'Купити'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          urls={photoUrls}
          startIdx={activeIdx}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      <OrderModal listing={showOrder ? listing : null} onClose={() => setShowOrder(false)} />
      <AuthPromptModal isOpen={showAuth} onClose={() => setShowAuth(false)} reason="favorites" />
    </div>
  )
}
