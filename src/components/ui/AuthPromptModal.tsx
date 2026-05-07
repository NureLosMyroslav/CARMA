// Модальне вікно для гостей
// Показується коли незареєстрований юзер намагається зробити захищену дію
// Наприклад: додати в улюблені або натиснути "Зв'язатись"
//
// Використання:
//   const [showAuth, setShowAuth] = useState(false)
//   <AuthPromptModal isOpen={showAuth} onClose={() => setShowAuth(false)} reason="favorites" />

import { Link } from 'react-router-dom'
import { X, Heart, MessageCircle, Star } from 'lucide-react'

// Текст залежно від того що намагався зробити гість
const reasons = {
  favorites: {
    icon: Heart,
    title: 'Додайте авто в улюблені',
    desc: 'Зареєструйтесь щоб зберігати цікаві оголошення і повертатись до них будь-коли.',
  },
  contact: {
    icon: MessageCircle,
    title: 'Зв\'яжіться з продавцем',
    desc: 'Зареєструйтесь щоб бачити контакти продавця та надсилати повідомлення.',
  },
  listing: {
    icon: Star,
    title: 'Розмістіть оголошення',
    desc: 'Зареєструйтесь щоб продавати автомобілі на платформі CARMA.',
  },
  default: {
    icon: Star,
    title: 'Потрібна реєстрація',
    desc: 'Зареєструйтесь щоб отримати доступ до всіх функцій платформи.',
  },
}

interface AuthPromptModalProps {
  isOpen: boolean
  onClose: () => void
  reason?: keyof typeof reasons // яку дію намагався виконати гість
}

export default function AuthPromptModal({
  isOpen,
  onClose,
  reason = 'default',
}: AuthPromptModalProps) {
  if (!isOpen) return null

  const content = reasons[reason]
  const Icon = content.icon

  return (
    // Фон-оверлей - клік закриває модалку
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      {/* Темний фон */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Саме вікно - stopPropagation щоб не закривалось при кліку всередині */}
      <div
        className="relative bg-[#111] border border-white/10 p-8 max-w-sm w-full"
        onClick={e => e.stopPropagation()}
      >
        {/* Кнопка закрити */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        {/* Іконка */}
        <div className="w-12 h-12 bg-white/5 flex items-center justify-center mb-6">
          <Icon size={22} className="text-white/60" />
        </div>

        {/* Текст */}
        <h3 className="text-lg font-medium mb-2">{content.title}</h3>
        <p className="text-white/50 text-sm leading-relaxed mb-8">{content.desc}</p>

        {/* Кнопки дій */}
        <div className="space-y-3">
          <Link
            to="/register"
            className="block w-full bg-white text-black text-sm font-medium py-3 text-center hover:bg-white/90 transition-colors"
          >
            Зареєструватись безкоштовно
          </Link>
          <Link
            to="/login"
            className="block w-full border border-white/20 text-white text-sm py-3 text-center hover:border-white/40 transition-colors"
          >
            Увійти
          </Link>
        </div>

        {/* Продовжити як гість */}
        <button
          onClick={onClose}
          className="w-full text-center mt-4 text-white/20 hover:text-white/40 text-xs transition-colors"
        >
          Продовжити перегляд →
        </button>
      </div>
    </div>
  )
}
