import type { CarIssue, CarSystem } from '@/lib/gemini'

interface Props {
  issues: CarIssue[]
}

// ─── Sports coupe — ViewBox 1000 × 310 ────────────────────────────────────
// Front faces LEFT.
// Key design: SHORT roof (12 % of car length), fender crowns, steep A/C pillars (~65°).
// Front wheel cx=228 cy=268 r=62  |  Rear wheel cx=726 cy=268 r=64
//
// Body path uses mostly straight lines for maximum sharpness.
// Fender crowns: hood dips to y=160 above front wheel (cx=228), rear deck dips to y=144 above rear wheel (cx=726).

const BODY = `
  M 78,268
  L 58,246  L 48,222  L 52,204  L 64,196
  L 96,182  L 162,168  L 208,162  L 228,160  L 248,162
  Q 275,154 296,148
  L 334,72   L 342,66
  L 452,64   L 460,70
  L 496,148
  L 698,148  L 726,144  L 748,148
  L 836,150  L 862,144  L 888,150
  Q 908,168  920,210
  Q 924,248  916,264
  Q 908,276  890,276
  L 78,268 Z
`

// ─── Glass (one large fast-back panel + thin side window) ─────────────────
// B-pillar at x=430 — windshield is the big piece, side window is small
const WINDSHIELD  = `M 296,148  L 334,72   L 342,66  L 430,64   L 424,148 Z`
const SIDE_WINDOW = `M 432,64   L 452,64   L 460,70  L 496,148  L 424,148 Z`

// ─── Body lines ────────────────────────────────────────────────────────────
// Shoulder crease — follows the fender crowns for a muscular look
const SHOULDER   = `M 64,196  L 228,164  L 296,152  L 496,158  L 726,150  L 888,162`
const SILL       = `M 148,252  L 887,248`
const B_PILLAR   = `M 430,64   L 424,148`
const DOOR_SEAM  = `M 440,150  L 438,250`
const HOOD_SPINE = `M 68,196   L 294,158`     // centre spine on hood

// ─── Fender vent (above front wheel) ──────────────────────────────────────
const VENT_FRAME = `M 204,160  L 252,158  L 252,172  L 204,174 Z`
const VENT_LINES = [`M 210,160 L 210,172`, `M 220,159 L 220,171`, `M 230,158 L 230,170`, `M 240,158 L 240,170`]

// ─── Headlight ─────────────────────────────────────────────────────────────
const HL_HOUSING = `M 50,234   L 68,200   L 100,190  L 98,210   L 56,246 Z`
const HL_LENS    = `M 52,230   L 70,202   L 98,194   L 96,208   L 58,240 Z`
const HL_DRL     = `M 56,226   L 96,196`
const HL_ACC     = `M 60,234   L 92,210`

// ─── Tail light ─────────────────────────────────────────────────────────────
const TL_HOUSING = `M 916,162  L 926,210  L 924,260  L 910,248  L 910,170 Z`
const TL_LENS    = `M 918,166  L 924,210  L 922,256  L 912,246  L 912,174 Z`

// ─── Trim ──────────────────────────────────────────────────────────────────
const MIRROR    = `M 310,164  L 332,154  L 332,167  L 310,174 Z`
const SPOILER   = `M 858,146  L 892,144  L 892,138  L 858,140 Z`
const SPLITTER  = `M 46,238   L 46,250   L 72,252   L 72,240 Z`
const INTAKE    = [`M 60,220 L 90,214`, `M 60,230 L 90,224`]
const DIFFUSER  = [`M 908,266 L 926,264`, `M 908,272 L 926,270`]

// ─── Wheel component ────────────────────────────────────────────────────────
type WP = { cx: number; cy: number; tire: number; rim: number; brake?: string }
const FW: WP = { cx: 228, cy: 268, tire: 62, rim: 40, brake: '#a81c1c' }
const RW: WP = { cx: 726, cy: 268, tire: 64, rim: 42 }

function Wheel({ cx, cy, tire, rim, brake = '#1c1c1c' }: WP) {
  const n = 7, inner = rim * 0.25, outer = rim * 0.91
  return (
    <g>
      <circle cx={cx} cy={cy} r={tire}        fill="#0d0d0d" stroke="#1a1a1a" strokeWidth="2.5" />
      <circle cx={cx} cy={cy} r={tire - 5}    fill="none"   stroke="#101010" strokeWidth="8" strokeDasharray="22 13" />
      <circle cx={cx} cy={cy} r={rim}         fill="url(#rimGrad)" stroke="#242424" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r={rim - 10}    fill="#111111" stroke="#1c1c1c" strokeWidth="0.8" />
      <rect x={cx - rim + 1} y={cy - 7} width={11} height={14} rx="1"
        fill={brake} transform={`rotate(-28,${cx},${cy})`} />
      {Array.from({ length: n }, (_, i) => {
        const a0 = (i * 360 / n - 8) * Math.PI / 180
        const a1 = (i * 360 / n + 8) * Math.PI / 180
        const p = [
          [cx + inner * Math.cos(a0), cy + inner * Math.sin(a0)],
          [cx + inner * Math.cos(a1), cy + inner * Math.sin(a1)],
          [cx + outer * Math.cos(a1), cy + outer * Math.sin(a1)],
          [cx + outer * Math.cos(a0), cy + outer * Math.sin(a0)],
        ]
        return <polygon key={i} points={p.map(v => v.join(',')).join(' ')}
          fill="#1f1f1f" stroke="#2a2a2a" strokeWidth="0.7" />
      })}
      <ellipse cx={cx - rim * 0.17} cy={cy - rim * 0.25} rx={rim * 0.20} ry={rim * 0.09}
        fill="rgba(255,255,255,0.04)" />
      <circle cx={cx} cy={cy} r={rim * 0.16}  fill="#151515" stroke="#282828" strokeWidth="1" />
    </g>
  )
}

// ─── Zones — polygons that TRACE the actual car body outline ──────────────
// This makes each zone look like a real car section, not a rectangle.
const ZONE_ENGINE_PTS        = `48,270 56,246 48,222 52,204 64,196 96,182 162,168 208,162 228,160 248,162 275,154 296,148 296,270`
const ZONE_ELECTRICAL_PTS    = `296,148 334,72 342,66 452,64 460,70 496,148`
const ZONE_EXHAUST_PTS       = `496,148 698,148 726,144 748,148 836,150 862,144 888,150 920,210 924,248 916,264 908,276 890,276 496,270`
const ZONE_BODY_PTS          = `48,64 944,64 944,280 48,280`  // full bounding rect (clipped to body)

const ZONES: Record<CarSystem, React.ReactNode> = {
  engine:          <polygon points={ZONE_ENGINE_PTS} />,
  electrical:      <polygon points={ZONE_ELECTRICAL_PTS} />,
  exhaust_cooling: <polygon points={ZONE_EXHAUST_PTS} />,
  transmission:    <rect x="228" y="244" width="498" height="30" rx="4" />,
  body:            <polygon points={ZONE_BODY_PTS} />,
  brakes: (
    <>
      <circle cx={FW.cx} cy={FW.cy} r="72" />
      <circle cx={RW.cx} cy={RW.cy} r="74" />
    </>
  ),
  suspension: (
    <>
      <ellipse cx={FW.cx} cy={FW.cy} rx="96" ry="82" />
      <ellipse cx={RW.cx} cy={RW.cy} rx="98" ry="84" />
    </>
  ),
}

const ZONE_LABELS: Record<CarSystem, string> = {
  engine:          'Двигун',
  transmission:    'Трансмісія',
  brakes:          'Гальма',
  suspension:      'Підвіска',
  electrical:      'Електрика',
  exhaust_cooling: 'Охолодження',
  body:            'Кузов',
}

const ZONE_LABEL_POS: Record<CarSystem, [number, number]> = {
  engine:          [172, 230],
  electrical:      [396, 110],
  exhaust_cooling: [710, 234],
  transmission:    [477, 259],
  body:            [490, 100],
  brakes:          [228, 213],
  suspension:      [726, 211],
}

type ZoneStatus = 'critical' | 'warning' | 'info'

function getZoneStatus(system: CarSystem, issues: CarIssue[]): ZoneStatus | null {
  const zi = issues.filter(i => i.system === system)
  if (!zi.length) return null
  if (zi.some(i => i.severity === 'critical')) return 'critical'
  if (zi.filter(i => i.severity === 'warning').length >= 2) return 'critical'
  if (zi.some(i => i.severity === 'warning')) return 'warning'
  return 'info'
}

const STATUS: Record<ZoneStatus, { fill: string; stroke: string; filterId: string }> = {
  critical: { fill: 'rgba(239,68,68,0.26)',  stroke: 'rgba(239,68,68,0.95)',  filterId: 'glow-red'    },
  warning:  { fill: 'rgba(234,179,8,0.22)',  stroke: 'rgba(234,179,8,0.95)',  filterId: 'glow-yellow' },
  info:     { fill: 'rgba(59,130,246,0.18)', stroke: 'rgba(59,130,246,0.88)', filterId: 'glow-blue'   },
}

const LEGEND: Array<{ status: ZoneStatus; label: string }> = [
  { status: 'critical', label: 'Критична проблема' },
  { status: 'warning',  label: 'Попередження' },
  { status: 'info',     label: 'До уваги' },
]

export default function CarVisualizer({ issues }: Props) {
  const systems = Object.keys(ZONES) as CarSystem[]

  return (
    <div className="w-full">
      <svg viewBox="0 0 1000 310" className="w-full" style={{ maxHeight: 460 }}
        aria-label="Стан автомобіля">
        <defs>
          <clipPath id="carClip"><path d={BODY} /></clipPath>

          {(['red','yellow','blue'] as const).map(c => (
            <filter key={c} id={`glow-${c}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation={c === 'red' ? '10' : '8'} result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          ))}

          <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#2e2e2e" />
            <stop offset="55%"  stopColor="#1c1c1c" />
            <stop offset="100%" stopColor="#111111" />
          </linearGradient>
          <linearGradient id="sheenGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.00)" />
          </linearGradient>
          <linearGradient id="glassGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="rgba(120,180,240,0.32)" />
            <stop offset="100%" stopColor="rgba(30,70,130,0.12)"   />
          </linearGradient>
          <radialGradient id="rimGrad" cx="35%" cy="28%" r="68%">
            <stop offset="0%"   stopColor="#3a3a3a" />
            <stop offset="100%" stopColor="#121212" />
          </radialGradient>
          <filter id="tlGlow" x="-60%" y="-30%" width="220%" height="160%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── Body ── */}
        <path d={BODY} fill="url(#bodyGrad)" stroke="#1e1e1e" strokeWidth="1" />

        {/* ── Zones clipped to body shape ── */}
        <g clipPath="url(#carClip)">
          <rect x="48" y="64" width="884" height="150" fill="url(#sheenGrad)" />
          {systems.map(sys => {
            const st = getZoneStatus(sys, issues)
            if (!st) return null
            const cfg = STATUS[st]
            return (
              <g key={sys} fill={cfg.fill} stroke={cfg.stroke} strokeWidth="1.5"
                filter={`url(#${cfg.filterId})`}>
                {ZONES[sys]}
                <animate attributeName="opacity" values="0.5;1;0.5"
                  dur={st === 'critical' ? '1.1s' : '2.2s'} repeatCount="indefinite" />
              </g>
            )
          })}
        </g>

        {/* ── Glass ── */}
        <path d={WINDSHIELD}  fill="url(#glassGrad)" stroke="rgba(80,135,195,0.55)" strokeWidth="1" />
        <path d={SIDE_WINDOW} fill="url(#glassGrad)" stroke="rgba(80,135,195,0.40)" strokeWidth="1" />

        {/* ── Body lines ── */}
        <path d={SHOULDER}   fill="none" stroke="#2c2c2c" strokeWidth="1.5" />
        <path d={SILL}       fill="none" stroke="#1a1a1a" strokeWidth="1.2" />
        <path d={B_PILLAR}   fill="none" stroke="#0e0e0e" strokeWidth="5"   />
        <path d={DOOR_SEAM}  fill="none" stroke="#191919" strokeWidth="0.9" />
        <path d={HOOD_SPINE} fill="none" stroke="#222222" strokeWidth="1.3" />

        {/* Fender vent */}
        <path d={VENT_FRAME} fill="#0e0e0e" stroke="#1e1e1e" strokeWidth="0.8" />
        {VENT_LINES.map((d, i) => <path key={i} d={d} fill="none" stroke="#060606" strokeWidth="2.2" />)}

        {/* ── Headlight ── */}
        <path d={HL_HOUSING} fill="#0b0b0b" stroke="#1c1c1c" strokeWidth="1" />
        <path d={HL_LENS}    fill="rgba(218,240,255,0.92)" />
        <path d={HL_DRL}     fill="none" stroke="rgba(190,225,255,0.72)" strokeWidth="2.4" strokeLinecap="round" />
        <path d={HL_ACC}     fill="none" stroke="rgba(160,205,255,0.36)" strokeWidth="1.3" strokeLinecap="round" />

        {/* ── Tail light ── */}
        <path d={TL_HOUSING} fill="#0f0000" stroke="#1e0808" strokeWidth="1" />
        <path d={TL_LENS}    fill="rgba(216,16,16,0.96)" filter="url(#tlGlow)" />

        {/* ── Intake / diffuser ── */}
        {INTAKE.map((d, i)   => <path key={i} d={d} fill="none" stroke="#151515" strokeWidth="2"   strokeLinecap="round" />)}
        {DIFFUSER.map((d, i) => <path key={i} d={d} fill="none" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round" />)}

        {/* ── Trim ── */}
        <path d={MIRROR}   fill="#101010" stroke="#202020" strokeWidth="0.8" />
        <path d={SPOILER}  fill="#141414" stroke="#242424" strokeWidth="1"   />
        <path d={SPLITTER} fill="#0b0b0b" stroke="#191919" strokeWidth="1"   />

        {/* ── Crisp outline ── */}
        <path d={BODY} fill="none" stroke="#333333" strokeWidth="2" />

        {/* ── Wheel wells ── */}
        <circle cx={FW.cx} cy={FW.cy} r={FW.tire + 4} fill="#080808" />
        <circle cx={RW.cx} cy={RW.cy} r={RW.tire + 4} fill="#080808" />

        {/* ── Wheels ── */}
        <Wheel {...FW} />
        <Wheel {...RW} />

        {/* ── Zone labels ── */}
        {systems.map(sys => {
          const st = getZoneStatus(sys, issues)
          if (!st) return null
          const [lx, ly] = ZONE_LABEL_POS[sys]
          const color = st === 'critical' ? '#f87171' : st === 'warning' ? '#fbbf24' : '#60a5fa'
          return (
            <text key={sys} x={lx} y={ly} textAnchor="middle"
              fill={color} fontSize="11" fontFamily="system-ui,sans-serif"
              letterSpacing="0.12em" fontWeight="700"
              paintOrder="stroke" stroke="rgba(0,0,0,0.72)" strokeWidth="3">
              {ZONE_LABELS[sys].toUpperCase()}
            </text>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-6 mt-3 px-1">
        {LEGEND.map(({ status, label }) => (
          <div key={status} className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
              status === 'critical' ? 'bg-red-500' : status === 'warning' ? 'bg-yellow-400' : 'bg-blue-500'
            }`} />
            <span className="text-white/45 text-xs tracking-wide">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white/15 flex-shrink-0" />
          <span className="text-white/45 text-xs tracking-wide">Без проблем</span>
        </div>
      </div>
    </div>
  )
}
