import { useRef, useState, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment } from '@react-three/drei'
import * as THREE from 'three'

export type Severity = 'critical' | 'warning' | 'attention' | 'ok'

export interface CarZone {
  id: string
  label: string
  severity: Severity
  description: string
}

interface CarDiagnosticViewerProps {
  zones?: CarZone[]
}

const SEVERITY_COLOR: Record<Severity, string> = {
  critical:  '#ef4444',
  warning:   '#eab308',
  attention: '#3b82f6',
  ok:        '#22c55e',
}

const SEVERITY_HEX: Record<Severity, number> = {
  critical:  0xef4444,
  warning:   0xeab308,
  attention: 0x3b82f6,
  ok:        0x22c55e,
}

const SEVERITY_LABEL: Record<Severity, string> = {
  critical:  'Критична проблема',
  warning:   'Попередження',
  attention: 'До уваги',
  ok:        'Без проблем',
}

export const DEFAULT_ZONES: CarZone[] = [
  { id: 'engine',       label: 'Двигун',      severity: 'critical',  description: 'Виявлено витік масла та перегрів' },
  { id: 'transmission', label: 'Трансмісія',  severity: 'warning',   description: 'Знос фрикційних дисків ~40%' },
  { id: 'suspension',   label: 'Підвіска',    severity: 'attention', description: 'Рекомендується перевірка амортизаторів' },
  { id: 'cooling',      label: 'Охолодження', severity: 'ok',        description: 'Система в нормі' },
  { id: 'brakes',       label: 'Гальма',      severity: 'warning',   description: 'Гальмівні колодки потребують заміни' },
]

const ZONE_FRACTIONS: Record<string, {
  length: number
  height: number
  width:  number
  radius: number
}> = {
  engine:       { length: 0.88, height: 0.45, width: 0.50, radius: 0.10 },
  cooling:      { length: 0.97, height: 0.38, width: 0.50, radius: 0.06 },
  transmission: { length: 0.50, height: 0.20, width: 0.50, radius: 0.09 },
  suspension:   { length: 0.15, height: 0.30, width: 0.50, radius: 0.10 },
  brakes:       { length: 0.85, height: 0.22, width: 0.50, radius: 0.07 },
}

const CAR_MODEL_URL =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CarConcept/glTF-Binary/CarConcept.glb'

interface GlowSphereProps {
  position: THREE.Vector3
  radius: number
  severity: Severity
  isSelected: boolean
  label: string
  onClick: () => void
}

function GlowSphere({ position, radius, severity, isSelected, onClick }: GlowSphereProps) {
  const innerRef = useRef<THREE.Mesh>(null)
  const outerRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const pulse = Math.sin(t * 2.5) * 0.5 + 0.5

    if (innerRef.current) {
      const mat = innerRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = isSelected ? 1.2 + pulse * 0.8 : 0.6 + pulse * 0.3
    }
    if (outerRef.current) {
      const mat = outerRef.current.material as THREE.MeshStandardMaterial
      mat.opacity = isSelected ? 0.25 + pulse * 0.15 : 0.10 + pulse * 0.08
      outerRef.current.scale.setScalar(1 + pulse * 0.12)
    }
  })

  const pos: [number, number, number] = [position.x, position.y, position.z]
  const color = SEVERITY_HEX[severity]

  return (
    <group position={pos} onClick={(e) => { e.stopPropagation(); onClick() }}>
      <mesh ref={innerRef} renderOrder={999}>
        <sphereGeometry args={[radius * 0.45, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          transparent
          opacity={0.95}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>

      <mesh ref={outerRef} renderOrder={998}>
        <sphereGeometry args={[radius, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          transparent
          opacity={0.18}
          depthWrite={false}
          depthTest={false}
          side={THREE.BackSide}
        />
      </mesh>

      <pointLight
        color={color}
        intensity={isSelected ? 3 : 1.2}
        distance={radius * 4}
        decay={2}
      />
    </group>
  )
}

interface CarSceneProps {
  zones: CarZone[]
  selectedZone: string | null
  onZoneClick: (id: string) => void
}

function CarScene({ zones, selectedZone, onZoneClick }: CarSceneProps) {
  const { scene } = useGLTF(CAR_MODEL_URL)
  const groupRef = useRef<THREE.Group>(null)
  const [zonePositions, setZonePositions] = useState<Record<string, { pos: THREE.Vector3; r: number }>>({})

  useEffect(() => {
    if (!scene || !groupRef.current) return
    const group = groupRef.current
    while (group.children.length) group.remove(group.children[0])

    const body = scene.clone(true)
    body.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return
      obj.material = new THREE.MeshPhysicalMaterial({
        color:           0x6fb3d8,
        transparent:     true,
        opacity:         0.18,
        roughness:       0.1,
        metalness:       0.7,
        envMapIntensity: 1.2,
        depthWrite:      false,
        side:            THREE.DoubleSide,
      })
      obj.renderOrder = 0
    })
    group.add(body)

    const box = new THREE.Box3().setFromObject(group)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = 4.5 / maxDim

    group.scale.setScalar(scale)
    group.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale)
    group.updateMatrixWorld(true)

    const worldBox = new THREE.Box3().setFromObject(group)
    const wSize = worldBox.getSize(new THREE.Vector3())
    const wMin  = worldBox.min
    const isZAxis = wSize.z > wSize.x

    const positions: Record<string, { pos: THREE.Vector3; r: number }> = {}
    for (const [id, def] of Object.entries(ZONE_FRACTIONS)) {
      let x: number
      let z: number
      if (isZAxis) {
        x = wMin.x + def.width  * wSize.x
        z = wMin.z + def.length * wSize.z
      } else {
        x = wMin.x + def.length * wSize.x
        z = wMin.z + def.width  * wSize.z
      }
      positions[id] = {
        pos: new THREE.Vector3(x, wMin.y + def.height * wSize.y, z),
        r: def.radius * Math.max(wSize.x, wSize.z),
      }
    }
    setZonePositions(positions)
  }, [scene])

  return (
    <group ref={groupRef}>
      {zones.map((zone) => {
        const zp = zonePositions[zone.id]
        if (!zp) return null
        return (
          <GlowSphere
            key={zone.id}
            position={zp.pos}
            radius={zp.r}
            severity={zone.severity}
            isSelected={selectedZone === zone.id}
            label={zone.label}
            onClick={() => onZoneClick(zone.id)}
          />
        )
      })}
    </group>
  )
}

function LoadingCar() {
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (meshRef.current) meshRef.current.rotation.y = clock.getElapsedTime() * 0.5
  })
  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[3, 1.2, 1.6]} />
      <meshStandardMaterial color={0x4fc3f7} wireframe transparent opacity={0.3} />
    </mesh>
  )
}

function InfoPanel({ zone, onClose }: { zone: CarZone | null; onClose: () => void }) {
  if (!zone) return null
  return (
    <div className="absolute bottom-4 left-4 bg-black/85 border border-white/10 p-5 min-w-60 backdrop-blur-sm z-20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: SEVERITY_COLOR[zone.severity] }} />
          <span className="text-white text-sm font-medium">{zone.label}</span>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white text-xs ml-4">✕</button>
      </div>
      <p className="text-xs mb-2 font-medium" style={{ color: SEVERITY_COLOR[zone.severity] }}>
        {SEVERITY_LABEL[zone.severity]}
      </p>
      <p className="text-white/55 text-xs leading-relaxed">{zone.description}</p>
    </div>
  )
}

function ZoneSidebar({ zones, selectedZone, onSelect }: {
  zones: CarZone[]
  selectedZone: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="absolute top-12 left-4 flex flex-col gap-1 z-20">
      {zones.map(zone => (
        <button
          key={zone.id}
          onClick={() => onSelect(selectedZone === zone.id ? '' : zone.id)}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs transition-all text-left rounded ${
            selectedZone === zone.id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
          }`}
        >
          <div className="w-2 h-2 rounded-full shrink-0 animate-pulse"
               style={{ backgroundColor: SEVERITY_COLOR[zone.severity] }} />
          {zone.label}
        </button>
      ))}
    </div>
  )
}

function Legend() {
  return (
    <div className="absolute top-12 right-4 flex flex-col gap-2 z-20">
      {(Object.entries(SEVERITY_LABEL) as [Severity, string][]).map(([sev, label]) => (
        <div key={sev} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SEVERITY_COLOR[sev] }} />
          <span className="text-white/40 text-xs">{label}</span>
        </div>
      ))}
    </div>
  )
}

export default function CarDiagnosticViewer({ zones = DEFAULT_ZONES }: CarDiagnosticViewerProps) {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const selectedZone = zones.find(z => z.id === selectedZoneId) ?? null

  const handleZoneClick = (id: string) =>
    setSelectedZoneId(prev => prev === id ? null : id)

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-[#080818] to-black border border-white/10">

      <div className="absolute top-4 left-4 z-20">
        <p className="text-white/40 text-xs tracking-[0.25em] uppercase">Візуалізація проблем</p>
      </div>
      <div className="absolute top-4 right-4 z-20">
        <p className="text-white/20 text-xs">Затисніть та тягніть для повороту</p>
      </div>

      <ZoneSidebar zones={zones} selectedZone={selectedZoneId} onSelect={handleZoneClick} />
      <Legend />

      <Canvas
        camera={{ position: [5, 2, 5], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 8, 5]}  intensity={1.0} />
        <directionalLight position={[-5, 3, -5]} intensity={0.4} />

        <Suspense fallback={<LoadingCar />}>
          <CarScene
            zones={zones}
            selectedZone={selectedZoneId}
            onZoneClick={handleZoneClick}
          />
          <Environment preset="city" />
        </Suspense>

        <OrbitControls
          enablePan={false}
          minDistance={3}
          maxDistance={12}
          maxPolarAngle={Math.PI / 2.1}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>

      <InfoPanel zone={selectedZone} onClose={() => setSelectedZoneId(null)} />
    </div>
  )
}

useGLTF.preload(CAR_MODEL_URL)
