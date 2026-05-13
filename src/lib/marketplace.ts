// Цей файл відповідає за всі запити до бази даних для маркетплейсу
// Тут зберігаються типи, хелпери та функції для роботи з оголошеннями, фото, замовленнями і улюбленими

import { supabase } from './supabase'

// ─── Типи даних ───────────────────────────────────────────────────────────────

// Фото автомобіля (зберігаються в Supabase Storage)
export interface CarPhoto {
  id: string
  car_id: string
  storage_path: string  // шлях до файлу в storage
  is_primary: boolean | null
  created_at: string
}

// Базова інформація про авто з таблиці cars
export interface Car {
  id: string
  user_id: string
  make: string        // марка (BMW, Toyota...)
  model: string       // модель (M5, Camry...)
  year: number
  mileage: number
  fuel_type: string
  transmission: string
}

// Оголошення з таблиці listings
export interface Listing {
  id: string
  car_id: string
  user_id: string
  title: string
  description: string | null
  price: number
  region: string | null
  city: string | null
  mileage: number | null
  status: string | null
  views_count: number | null
  created_at: string
  cars: Car  // joined через foreign key
}

// Оголошення з головним фото (для карток на сторінці маркетплейсу)
export interface ListingWithPhoto extends Listing {
  primaryPhotoUrl: string | null
}

// Дані для форми створення/редагування оголошення
export interface CreateListingData {
  make: string
  model: string
  year: number
  mileage: number
  fuelType: string
  transmission: string
  title: string
  description: string
  price: number
  city: string
  region: string
}

// ─── Допоміжні функції ────────────────────────────────────────────────────────

// Повертає публічний URL фото з Supabase Storage
export function getPhotoUrl(storagePath: string): string {
  const { data } = supabase.storage.from('car-photos').getPublicUrl(storagePath)
  return data.publicUrl
}

// Додає головне фото до кожного оголошення
// Робимо один запит для всіх авто відразу, щоб не було N+1 проблеми
async function attachPrimaryPhotos(listings: Listing[]): Promise<ListingWithPhoto[]> {
  if (!listings.length) return []

  const carIds = listings.map(l => l.car_id)

  // Отримуємо всі фото для всіх авто одним запитом
  const { data: photos } = await supabase
    .from('car_photos')
    .select('car_id, storage_path, is_primary')
    .in('car_id', carIds)

  // Будуємо map: car_id -> storage_path головного фото
  // Якщо є is_primary - беремо його, якщо ні - беремо перше яке знайшли
  const photoMap: Record<string, string> = {}
  for (const p of photos || []) {
    if (!photoMap[p.car_id] || p.is_primary) {
      photoMap[p.car_id] = p.storage_path
    }
  }

  return listings.map(l => ({
    ...l,
    primaryPhotoUrl: photoMap[l.car_id] ? getPhotoUrl(photoMap[l.car_id]) : null,
  }))
}

// ─── Публічні запити (для звичайних користувачів) ─────────────────────────────

// Отримати всі активні оголошення (тільки зі статусом 'active')
export async function fetchActiveListings(): Promise<ListingWithPhoto[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('*, cars(*)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) throw error
  return attachPrimaryPhotos(data || [])
}

// Отримати конкретне оголошення з усіма фото (для сторінки деталей)
export async function fetchListingById(id: string): Promise<ListingWithPhoto & { allPhotos: CarPhoto[] }> {
  const { data: listing, error } = await supabase
    .from('listings')
    .select('*, cars(*)')
    .eq('id', id)
    .single()

  if (error) throw error

  // Окремо тягнемо всі фото цього авто, головне фото йде першим
  const { data: photos } = await supabase
    .from('car_photos')
    .select('*')
    .eq('car_id', listing.car_id)
    .order('is_primary', { ascending: false })

  const primary = (photos || []).find(p => p.is_primary) || photos?.[0]

  return {
    ...listing,
    primaryPhotoUrl: primary ? getPhotoUrl(primary.storage_path) : null,
    allPhotos: photos || [],
  }
}

// ─── Улюблені ─────────────────────────────────────────────────────────────────

// Отримати список id оголошень які юзер додав в улюблені
export async function fetchUserFavorites(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('favorites')
    .select('listing_id')
    .eq('user_id', userId)
  return (data || []).map(f => f.listing_id)
}

// Додати або прибрати з улюблених (toggle)
// Повертає true якщо додали, false якщо прибрали
export async function toggleFavorite(listingId: string, userId: string): Promise<boolean> {
  // Перевіряємо чи вже є в улюблених
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('listing_id', listingId)
    .eq('user_id', userId)
    .single()

  if (existing) {
    // Є - видаляємо
    await supabase.from('favorites').delete().eq('id', existing.id)
    return false
  } else {
    // Нема - додаємо
    await supabase.from('favorites').insert({ listing_id: listingId, user_id: userId })
    return true
  }
}

// ─── Замовлення ───────────────────────────────────────────────────────────────

// Створити заявку на купівлю
export async function createOrder(params: {
  listingId: string
  userId?: string
  name: string
  phone: string
}): Promise<void> {
  const { error } = await supabase.from('orders').insert({
    listing_id: params.listingId,
    user_id: params.userId || null,  // може бути null якщо не авторизований
    name: params.name,
    phone: params.phone,
    status: 'pending',  // за замовчуванням - в обробці
  })
  if (error) throw error
}

// ─── Адмін запити ─────────────────────────────────────────────────────────────

// Отримати всі оголошення (включаючи sold, draft і т.д.)
export async function fetchAllListings(): Promise<ListingWithPhoto[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('*, cars(*)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return attachPrimaryPhotos(data || [])
}

// Створити нове оголошення з авто і фото
// Порядок: спочатку car -> потім photos -> потім listing
export async function createListing(
  userId: string,
  data: CreateListingData,
  photos: { file: File; isPrimary: boolean }[]
): Promise<string> {
  // Крок 1: створюємо запис авто
  const { data: car, error: carErr } = await supabase
    .from('cars')
    .insert({
      user_id: userId,
      make: data.make,
      model: data.model,
      year: data.year,
      mileage: data.mileage,
      fuel_type: data.fuelType,
      transmission: data.transmission,
    })
    .select()
    .single()
  if (carErr) throw carErr

  // Крок 2: завантажуємо фото в storage і записуємо шляхи в car_photos
  for (const photo of photos) {
    const ext = photo.file.name.split('.').pop() || 'jpg'
    // Генеруємо унікальне ім'я файлу щоб не було колізій
    const path = `${car.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('car-photos')
      .upload(path, photo.file)
    if (uploadErr) throw uploadErr

    await supabase.from('car_photos').insert({
      car_id: car.id,
      storage_path: path,
      is_primary: photo.isPrimary,
    })
  }

  // Крок 3: створюємо оголошення і прив'язуємо до авто
  const { data: listing, error: listErr } = await supabase
    .from('listings')
    .insert({
      car_id: car.id,
      user_id: userId,
      title: data.title,
      description: data.description,
      price: data.price,
      city: data.city,
      region: data.region,
      mileage: data.mileage,
      status: 'active',
    })
    .select()
    .single()
  if (listErr) throw listErr

  return listing.id
}

// Оновити існуюче оголошення (тільки дані, без фото)
export async function updateListing(
  listingId: string,
  carId: string,
  data: Partial<CreateListingData>
): Promise<void> {
  // Оновлюємо і таблицю cars і таблицю listings
  await supabase.from('cars').update({
    make: data.make,
    model: data.model,
    year: data.year,
    mileage: data.mileage,
    fuel_type: data.fuelType,
    transmission: data.transmission,
  }).eq('id', carId)

  await supabase.from('listings').update({
    title: data.title,
    description: data.description,
    price: data.price,
    city: data.city,
    region: data.region,
    mileage: data.mileage,
  }).eq('id', listingId)
}

// Видалити оголошення, авто і всі фото
export async function deleteListing(listingId: string, carId: string): Promise<void> {
  // Спочатку дістаємо шляхи до файлів щоб видалити з storage
  const { data: photos } = await supabase
    .from('car_photos')
    .select('storage_path')
    .eq('car_id', carId)

  if (photos?.length) {
    await supabase.storage.from('car-photos').remove(photos.map(p => p.storage_path))
  }

  // Видаляємо оголошення і авто (car_photos видалиться каскадно через FK)
  await supabase.from('listings').delete().eq('id', listingId)
  await supabase.from('cars').delete().eq('id', carId)
}

// Додати нові фото до існуючого оголошення
export async function addPhotosToListing(
  carId: string,
  photos: { file: File; isPrimary: boolean }[]
): Promise<void> {
  for (const photo of photos) {
    const ext = photo.file.name.split('.').pop() || 'jpg'
    const path = `${carId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    await supabase.storage.from('car-photos').upload(path, photo.file)
    await supabase.from('car_photos').insert({
      car_id: carId,
      storage_path: path,
      is_primary: photo.isPrimary,
    })
  }
}

// Видалити одне фото (і з storage і з БД)
export async function deletePhoto(photoId: string, storagePath: string): Promise<void> {
  await supabase.storage.from('car-photos').remove([storagePath])
  await supabase.from('car_photos').delete().eq('id', photoId)
}

// Встановити головне фото для авто
// Спочатку скидаємо всі is_primary, потім ставимо потрібне
export async function setPrimaryPhoto(carId: string, photoId: string): Promise<void> {
  await supabase.from('car_photos').update({ is_primary: false }).eq('car_id', carId)
  await supabase.from('car_photos').update({ is_primary: true }).eq('id', photoId)
}
