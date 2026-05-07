// Головна сторінка (лендінг) платформи CARMA
// Стиль натхненний преміальними автомобільними сайтами (темна тема, мінімалізм)

import { Link } from 'react-router-dom'
import { ArrowRight, Shield, Bot, Car, BarChart3, Bell, ShoppingCart } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'

// Список функцій платформи для секції "Можливості"
// Кожен об'єкт містить іконку з lucide-react, заголовок і опис
const features = [
  {
    icon: Car,
    title: 'Особистий гараж',
    desc: 'Зберігайте всю інформацію про свої автомобілі в одному місці. VIN, пробіг, фото, технічні характеристики.',
  },
  {
    icon: Bot,
    title: 'AI-діагностика',
    desc: 'Персоналізований аналіз технічного стану вашого авто на основі Gemini AI з індексом здоров\'я Car Health Score.',
  },
  {
    icon: ShoppingCart,
    title: 'Маркетплейс',
    desc: 'Купуйте та продавайте автомобілі з прозорою "кармою" — повною історією експлуатації від попереднього власника.',
  },
  {
    icon: BarChart3,
    title: 'Аналітика витрат',
    desc: 'Графіки та статистика витрат на автомобіль. Порівняння з середніми показниками інших користувачів.',
  },
  {
    icon: Bell,
    title: 'Нагадування',
    desc: 'Гнучке налаштування нагадувань про планове ТО за датою або пробігом. Ніколи не пропускайте обслуговування.',
  },
  {
    icon: Shield,
    title: 'Безпека даних',
    desc: 'Row Level Security на рівні бази даних. Ваші дані доступні тільки вам.',
  },
]

// Статистика для секції під хіро
const stats = [
  { value: '3', label: 'Ключові модулі' },
  { value: 'AI', label: 'Gemini 2.0 Flash' },
  { value: 'RLS', label: 'Захист даних' },
  { value: '∞', label: 'Автомобілів у гаражі' },
]

// Тестові дані для превью маркетплейсу на головній
// TODO: в майбутньому замінити на реальні дані з Supabase через useQuery
const previewListings = [
  { brand: 'BMW', model: '5 Series', year: 2021, price: '38 500', mileage: '42 000', score: 91 },
  { brand: 'Toyota', model: 'Camry', year: 2020, price: '24 900', mileage: '67 000', score: 84 },
  { brand: 'Audi', model: 'A6', year: 2022, price: '45 000', mileage: '28 000', score: 95 },
]

// Список переваг AI-діагностики для секції з поясненням
const aiFeatureList = [
  'Критичні проблеми',
  'Попередження',
  'Профілактичні рекомендації',
  'AI-чат з автоекспертом',
]

// Демо-дані для картки Car Health Score в AI-секції
const healthScoreDemo = [
  { label: 'Двигун', val: 92, color: 'bg-green-400' },
  { label: 'Гальма', val: 78, color: 'bg-yellow-400' },
  { label: 'Підвіска', val: 85, color: 'bg-green-400' },
]

export default function HomePage() {
  return (
    <div className="bg-black min-h-screen text-white">
      {/* Навігаційна панель */}
      <Navbar />

      {/* === HERO СЕКЦІЯ === */}
      {/* Повноекранний блок з фоновим фото авто та текстом */}
      <section className="relative h-screen flex items-center overflow-hidden">

        {/* Фонове зображення */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=1920&q=80')`,
          }}
        />

        {/* Темний градієнт зліва - щоб текст було видно на фоні */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />

        {/* Контент хіро */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <p className="text-white/50 text-xs tracking-[0.3em] uppercase mb-6">
            Веб-платформа нового покоління
          </p>
          <h1 className="text-5xl md:text-7xl font-light leading-tight mb-6 max-w-2xl">
            Ваш автомобіль.<br />
            <span className="text-white/50">Під контролем.</span>
          </h1>
          <p className="text-white/60 text-lg max-w-md mb-10 leading-relaxed">
            CARMA об'єднує AI-діагностику, облік авто та маркетплейс в одній платформі.
          </p>

          {/* Кнопки дій */}
          <div className="flex flex-wrap gap-4">
            <Link
              to="/register"
              className="bg-white text-black px-8 py-3.5 text-sm font-medium tracking-wide hover:bg-white/90 transition-all duration-200 flex items-center gap-2"
            >
              Розпочати безкоштовно
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/marketplace"
              className="border border-white/30 text-white px-8 py-3.5 text-sm font-medium tracking-wide hover:border-white/60 transition-all duration-200"
            >
              Переглянути маркетплейс
            </Link>
          </div>
        </div>

        {/* Анімована лінія внизу - підказка скролити */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <div className="w-px h-8 bg-white/30" />
        </div>
      </section>

      {/* === СТАТИСТИКА === */}
      <section className="border-y border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-light mb-1">{stat.value}</div>
              <div className="text-white/40 text-xs tracking-widest uppercase">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* === ФУНКЦІЇ ПЛАТФОРМИ === */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="mb-16">
          <p className="text-white/40 text-xs tracking-[0.3em] uppercase mb-4">Можливості</p>
          <h2 className="text-3xl md:text-4xl font-light">Все що потрібно автовласнику</h2>
        </div>

        {/* Сітка карток функцій - gap-px з фоном дає ефект розділювачів між картками */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10">
          {features.map(feature => (
            <div
              key={feature.title}
              className="bg-black p-8 hover:bg-white/5 transition-colors duration-300 group"
            >
              {/* Іконка - стає білою при наведенні */}
              <feature.icon
                size={24}
                className="text-white/40 group-hover:text-white mb-6 transition-colors duration-300"
              />
              <h3 className="text-lg font-medium mb-3">{feature.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* === AI СЕКЦІЯ === */}
      {/* Пояснення як працює AI-діагностика + демо картка */}
      <section className="py-24 bg-white/5">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">

          {/* Текстова частина зліва */}
          <div>
            <p className="text-white/40 text-xs tracking-[0.3em] uppercase mb-4">Штучний інтелект</p>
            <h2 className="text-3xl md:text-4xl font-light mb-6">
              AI-помічник, який знає ваше авто
            </h2>
            <p className="text-white/50 leading-relaxed mb-8">
              Інтеграція з Google Gemini 2.0 Flash аналізує технічний стан вашого автомобіля,
              враховуючи модель, рік випуску та пробіг. Отримуйте персоналізовані рекомендації
              та індекс Car Health Score.
            </p>

            {/* Список переваг */}
            <ul className="space-y-3 mb-10">
              {aiFeatureList.map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-white/70">
                  <div className="w-1 h-1 bg-white rounded-full" />
                  {item}
                </li>
              ))}
            </ul>

            <Link
              to="/register"
              className="inline-flex items-center gap-2 text-sm text-white border-b border-white/30 pb-0.5 hover:border-white transition-colors duration-200"
            >
              Спробувати AI-діагностику <ArrowRight size={14} />
            </Link>
          </div>

          {/* Демо-картка Car Health Score справа */}
          <div className="bg-black border border-white/10 p-8 space-y-4">
            <div className="flex items-center gap-3 mb-6">
              {/* Пульсуюча точка - імітація "живого" показника */}
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white/50 text-xs tracking-widest uppercase">Car Health Score</span>
            </div>

            {/* Велике число - загальний бал */}
            <div className="text-7xl font-light text-center py-8">
              87<span className="text-3xl text-white/30">/100</span>
            </div>

            {/* Прогрес-бари для кожної системи авто */}
            <div className="space-y-3">
              {healthScoreDemo.map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs text-white/40 mb-1">
                    <span>{item.label}</span>
                    <span>{item.val}%</span>
                  </div>
                  {/* Тонка лінія прогресу */}
                  <div className="h-px bg-white/10">
                    <div
                      className={`h-px ${item.color}`}
                      style={{ width: `${item.val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* === ПРЕВЬЮ МАРКЕТПЛЕЙСУ === */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="mb-16 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-white/40 text-xs tracking-[0.3em] uppercase mb-4">Маркетплейс</p>
            <h2 className="text-3xl md:text-4xl font-light">Прозорий продаж авто</h2>
          </div>
          <Link
            to="/marketplace"
            className="text-sm text-white/50 hover:text-white transition-colors flex items-center gap-2"
          >
            Всі оголошення <ArrowRight size={14} />
          </Link>
        </div>

        {/* Картки оголошень (поки статичні, потім замінити на дані з БД) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10">
          {previewListings.map(car => (
            <div
              key={car.model}
              className="bg-black p-6 hover:bg-white/5 transition-colors duration-300 group cursor-pointer"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-white/40 text-xs mb-1">{car.year}</p>
                  <h3 className="text-lg font-medium">{car.brand} {car.model}</h3>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-xs mb-1">Health Score</p>
                  <p className="text-lg font-light">{car.score}</p>
                </div>
              </div>

              <div className="flex justify-between items-end">
                <p className="text-white/40 text-xs">{car.mileage} км</p>
                <p className="text-xl font-light">${car.price}</p>
              </div>

              {/* Позначка "Перевірено AI" */}
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
                <Shield size={12} className="text-white/30" />
                <span className="text-white/30 text-xs">Перевірено AI</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* === CTA - ЗАКЛИК ДО ДІЇ === */}
      <section className="py-32 text-center border-t border-white/10">
        <p className="text-white/40 text-xs tracking-[0.3em] uppercase mb-6">Почати зараз</p>
        <h2 className="text-4xl md:text-5xl font-light mb-8 max-w-2xl mx-auto">
          Візьміть свій автомобіль під контроль
        </h2>
        <p className="text-white/50 mb-12 max-w-md mx-auto">
          Безкоштовний доступ. Без кредитної картки. Почніть за 30 секунд.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 bg-white text-black px-10 py-4 text-sm font-medium tracking-wide hover:bg-white/90 transition-all duration-200"
        >
          Створити акаунт <ArrowRight size={16} />
        </Link>
      </section>

      {/* === ФУТЕР === */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
          <span className="text-white/30 text-xs tracking-widest uppercase">CARMA © 2026</span>
          <p className="text-white/20 text-xs">Car Analytics, Recommendations & MArketplace</p>
        </div>
      </footer>
    </div>
  )
}
