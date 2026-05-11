import { useEffect, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, Info, Zap, RefreshCw } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import CarDiagnosticViewer from '@/components/car/CarDiagnosticViewer'
import type { CarZone } from '@/components/car/CarDiagnosticViewer'
import { analyzeCar } from '@/lib/gemini'
import type { CarInfo, CarIssue, DiagnosticsResult, IssueSeverity, CarSystem } from '@/lib/gemini'

const SYSTEM_LABELS: Record<CarSystem, string> = {
  engine: 'Двигун',
  transmission: 'Трансмісія',
  brakes: 'Гальма',
  suspension: 'Підвіска',
  electrical: 'Електрика',
  exhaust_cooling: 'Охолодження / Вихлоп',
  body: 'Кузов',
}

// Map gemini CarSystem → CarDiagnosticViewer zone id
const SYSTEM_TO_ZONE_ID: Partial<Record<CarSystem, string>> = {
  engine:          'engine',
  transmission:    'transmission',
  brakes:          'brakes',
  suspension:      'suspension',
  electrical:      'electrical',
  exhaust_cooling: 'cooling',
}

function issuesToZones(issues: CarIssue[]): CarZone[] {
  const severityRank: Record<IssueSeverity, number> = { critical: 3, warning: 2, info: 1 }

  const byZone: Record<string, { severity: IssueSeverity; issue: CarIssue }> = {}

  for (const issue of issues) {
    const zoneId = SYSTEM_TO_ZONE_ID[issue.system]
    if (!zoneId) continue
    const current = byZone[zoneId]
    if (!current || severityRank[issue.severity] > severityRank[current.severity]) {
      byZone[zoneId] = { severity: issue.severity, issue }
    }
  }

  const severityMap: Record<IssueSeverity, CarZone['severity']> = {
    critical: 'critical',
    warning:  'warning',
    info:     'attention',
  }

  const allZoneIds = ['engine', 'transmission', 'brakes', 'suspension', 'electrical', 'cooling']

  return allZoneIds.map(zoneId => {
    const entry = byZone[zoneId]
    const labelMap: Record<string, string> = {
      engine:       'Двигун',
      transmission: 'Трансмісія',
      brakes:       'Гальма',
      suspension:   'Підвіска',
      electrical:   'Електрика',
      cooling:      'Охолодження',
    }
    if (entry) {
      return {
        id:          zoneId,
        label:       labelMap[zoneId],
        severity:    severityMap[entry.severity],
        description: `${entry.issue.title}. ${entry.issue.description}`,
      }
    }
    return {
      id:          zoneId,
      label:       labelMap[zoneId],
      severity:    'ok' as const,
      description: 'Проблем не виявлено',
    }
  })
}

const SEVERITY_CONFIG: Record<
  IssueSeverity,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  critical: {
    label: 'Критично',
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/30',
    icon: <Zap size={12} />,
  },
  warning: {
    label: 'Попередження',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    icon: <AlertTriangle size={12} />,
  },
  info: {
    label: 'До уваги',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/30',
    icon: <Info size={12} />,
  },
}

function ScoreRing({ score }: { score: number }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color =
    score >= 80 ? '#4ade80'
    : score >= 60 ? '#facc15'
    : '#f87171'

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90">
        <circle cx="72" cy="72" r={radius} fill="none" stroke="#1a1a1a" strokeWidth="8" />
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="text-center z-10">
        <div className="text-3xl font-light" style={{ color }}>{score}</div>
        <div className="text-white/30 text-xs tracking-widest uppercase">/ 100</div>
      </div>
    </div>
  )
}

function IssueCard({ issue }: { issue: CarIssue }) {
  const cfg = SEVERITY_CONFIG[issue.severity]
  return (
    <div className={`border ${cfg.bg} p-5 space-y-3`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium tracking-wide ${cfg.color}`}
            >
              {cfg.icon}
              {cfg.label}
            </span>
            <span className="text-white/25 text-xs">•</span>
            <span className="text-white/40 text-xs">{SYSTEM_LABELS[issue.system]}</span>
          </div>
          <h3 className="text-white font-medium text-sm">{issue.title}</h3>
        </div>
      </div>
      <p className="text-white/55 text-sm leading-relaxed">{issue.description}</p>
      <div className="pt-2 border-t border-white/5">
        <p className="text-white/40 text-xs leading-relaxed">
          <span className="text-white/25 uppercase tracking-widest text-[10px] mr-2">Рекомендація</span>
          {issue.recommendation}
        </p>
      </div>
    </div>
  )
}

function LoadingState({ car }: { car: CarInfo }) {
  const [dots, setDots] = useState('')
  useEffect(() => {
    const id = setInterval(() => setDots(d => (d.length >= 3 ? '' : d + '.')), 500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] gap-8 px-6 text-center">
        <div className="w-16 h-16 border border-white/10 flex items-center justify-center">
          <RefreshCw size={24} className="text-white/30 animate-spin" />
        </div>
        <div>
          <p className="text-white/30 text-xs tracking-[0.3em] uppercase mb-3">Gemini AI аналізує</p>
          <h2 className="text-xl font-light mb-1">
            {car.year} {car.make} {car.model}
          </h2>
          <p className="text-white/30 text-sm">{car.mileage.toLocaleString('uk-UA')} км</p>
        </div>
        <p className="text-white/30 text-sm">Формую звіт{dots}</p>
        <div className="w-48 h-px bg-white/5 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1/3 bg-white/20 animate-[slide_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  )
}

const _DEMO_CAR: CarInfo = { make: 'Nissan', model: 'GT-R', year: 2020, mileage: 52000, fuelType: 'Бензин', transmission: 'Автомат' }
const _DEMO_RESULT: DiagnosticsResult = {
  overall_score: 62,
  issues: [
    { id: '1', system: 'engine',          severity: 'critical', title: 'Витік моторного масла',     description: 'Виявлено витік у прокладці клапанної кришки.',    recommendation: 'Замініть прокладку клапанної кришки негайно.' },
    { id: '2', system: 'brakes',          severity: 'critical', title: 'Знос гальмівних колодок',   description: 'Залишок колодок менше 2 мм — критичний знос.',      recommendation: 'Замініть гальмівні колодки та диски.' },
    { id: '3', system: 'suspension',      severity: 'warning',  title: 'Зношені амортизатори',     description: 'Амортизатори потребують перевірки або заміни.',     recommendation: 'Перевірте амортизатори на СТО.' },
    { id: '4', system: 'electrical',      severity: 'warning',  title: 'Слабкий акумулятор',       description: 'Напруга акумулятора нижче норми при запуску.',      recommendation: 'Перевірте та при потребі замініть АКБ.' },
    { id: '5', system: 'exhaust_cooling', severity: 'info',     title: 'Антифриз потребує заміни', description: 'Рекомендовано замінити охолоджуючу рідину.',         recommendation: 'Промийте систему та залийте новий антифриз.' },
    { id: '6', system: 'transmission',    severity: 'info',     title: 'Заміна рідини АКПП',       description: 'Рідина не замінювалась понад 60 000 км.',          recommendation: 'Замініть рідину в автоматичній коробці передач.' },
  ],
}

export default function DiagnosticsResultPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const isDemo = new URLSearchParams(location.search).get('demo') === '1'
  const car = (location.state?.car ?? (isDemo ? _DEMO_CAR : undefined)) as CarInfo | undefined

  const [result, setResult] = useState<DiagnosticsResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!car) return
    if (isDemo) { setResult(_DEMO_RESULT); setLoading(false); return }
    let cancelled = false
    setLoading(true)
    setError(null)
    analyzeCar(car)
      .then(result => { if (!cancelled) setResult(result) })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Невідома помилка') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!car) {
    return (
      <div className="bg-black min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/50 mb-4">Дані автомобіля не знайдено.</p>
          <Link to="/diagnostics" className="text-sm underline underline-offset-4 text-white/40 hover:text-white">
            Повернутись до діагностики
          </Link>
        </div>
      </div>
    )
  }

  if (loading) return <LoadingState car={car} />

  if (error) {
    return (
      <div className="bg-black min-h-screen text-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] gap-6 px-6 text-center">
          <AlertTriangle size={32} className="text-red-400" />
          <div>
            <h2 className="text-xl font-light mb-2">Помилка аналізу</h2>
            <p className="text-white/40 text-sm max-w-sm">{error}</p>
          </div>
          <button
            onClick={() => navigate('/diagnostics')}
            className="border border-white/20 text-white px-6 py-2.5 text-sm hover:border-white/40 transition-colors"
          >
            Спробувати знову
          </button>
        </div>
      </div>
    )
  }

  if (!result) return null

  const criticalCount = result.issues.filter(i => i.severity === 'critical').length
  const warningCount = result.issues.filter(i => i.severity === 'warning').length

  const scoreLabel =
    result.overall_score >= 80 ? 'Добрий стан'
    : result.overall_score >= 60 ? 'Задовільний стан'
    : 'Потребує уваги'

  const zones = issuesToZones(result.issues)

  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 pt-24 pb-20">
        {/* Header */}
        <div className="mb-10">
          <button
            onClick={() => navigate('/diagnostics')}
            className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-8 transition-colors"
          >
            <ArrowLeft size={14} />
            Нова діагностика
          </button>

          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-white/40 text-xs tracking-[0.3em] uppercase mb-2">AI-діагностика</p>
              <h1 className="text-2xl md:text-3xl font-light">
                {car.year} {car.make} {car.model}
              </h1>
              <p className="text-white/40 text-sm mt-1">
                {car.mileage.toLocaleString('uk-UA')} км • {car.fuelType} • {car.transmission}
              </p>
            </div>

            {/* Score */}
            <div className="flex items-center gap-6">
              <ScoreRing score={result.overall_score} />
              <div>
                <p className="text-white font-medium">{scoreLabel}</p>
                <p className="text-white/40 text-xs mt-1">
                  {criticalCount > 0 && (
                    <span className="text-red-400">{criticalCount} критичних</span>
                  )}
                  {criticalCount > 0 && warningCount > 0 && <span className="mx-1">·</span>}
                  {warningCount > 0 && (
                    <span className="text-yellow-400">{warningCount} попереджень</span>
                  )}
                  {criticalCount === 0 && warningCount === 0 && (
                    <span className="text-green-400">Без серйозних проблем</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Car Visualizer */}
        <div className="h-[420px] mb-10">
          <CarDiagnosticViewer zones={zones} />
        </div>

        {/* Issues list */}
        <div>
          <p className="text-white/30 text-xs tracking-[0.3em] uppercase mb-6">
            Звіт ({result.issues.length} пунктів)
          </p>
          <div className="space-y-3">
            {result.issues.map(issue => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-12 flex flex-wrap gap-4">
          <button
            onClick={() => navigate('/diagnostics')}
            className="bg-white text-black px-8 py-3.5 text-sm font-medium hover:bg-white/90 transition-colors"
          >
            Нова діагностика
          </button>
          <button
            onClick={() => window.print()}
            className="border border-white/20 text-white px-8 py-3.5 text-sm hover:border-white/40 transition-colors"
          >
            Зберегти звіт
          </button>
        </div>
      </div>
    </div>
  )
}
