import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { useControls } from 'leva'
import { PowerPoleModel } from './PowerPoleModel'
import { Cable } from './Cable'
import { DEFAULT_POLE_DIMS, insulatorAnchors } from './dimensions'
import type { PoleDims } from './dimensions'

function PowerPoleContent() {
  const d = DEFAULT_POLE_DIMS
  // Panel de tuneo de medidas (en vivo).
  const c = useControls('Poste · medidas', {
    postHeight: { value: d.postHeight, min: 8, max: 30, step: 0.5, label: 'alto poste' },
    postRadius: { value: d.postRadius, min: 0.15, max: 1, step: 0.01, label: 'radio poste' },
    crossarmLength: { value: d.crossarmLength, min: 3, max: 14, step: 0.1, label: 'largo crossarm' },
    crossarmHeight: { value: d.crossarmHeight, min: 0.2, max: 1.2, step: 0.01, label: 'alto tabla' },
    crossarmDepth: { value: d.crossarmDepth, min: 0.2, max: 1, step: 0.01, label: 'espesor tabla' },
    upperCrossarmY: { value: d.upperCrossarmY, min: 6, max: 28, step: 0.1, label: 'altura crossarm sup' },
    crossarmGap: { value: d.crossarmGap, min: 1, max: 10, step: 0.1, label: 'gap crossarms' },
    insulatorScale: { value: d.insulatorScale, min: 0.3, max: 2, step: 0.05, label: 'escala insulators' },
    insulatorInset: { value: d.insulatorInset, min: 0.2, max: 3, step: 0.05, label: 'inset insulators' },
    braceThickness: { value: d.braceThickness, min: 0.04, max: 0.4, step: 0.01, label: 'grosor braces' },
    braceDrop: { value: d.braceDrop, min: 0.5, max: 4, step: 0.1, label: 'caída V braces' },
    braceTopInset: { value: d.braceTopInset, min: 0.3, max: 3.5, step: 0.05, label: 'apoyo braces' },
    boltRadius: { value: d.boltRadius, min: 0.03, max: 0.25, step: 0.01, label: 'radio pernos' },
  })
  // Panel de los cables / física.
  const cab = useControls('Cables', {
    separacion: { value: 14, min: 4, max: 40, step: 0.5, label: 'separación postes' },
    largoCable: { value: 16, min: 4, max: 50, step: 0.5, label: 'largo cable (slack)' },
    gravedad: { value: 0.012, min: 0, max: 0.05, step: 0.001, label: 'gravedad' },
    segmentos: { value: 16, min: 4, max: 40, step: 1, label: 'segmentos' },
    grosor: { value: 2.5, min: 0.5, max: 8, step: 0.5, label: 'grosor cable' },
    color: { value: '#1c1c22', label: 'color cable' },
  })
  const dims: PoleDims = { ...d, ...c }
  const sep = cab.separacion
  const anchors = insulatorAnchors(dims) // locales (mismos para ambos postes)

  return (
    <>
      <color attach="background" args={['#64b5f6']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[8, 18, 10]} intensity={2.5} castShadow />
      <Environment preset="city" />

      {/* Poste A (z=0) y Poste B (z=separación). */}
      <PowerPoleModel dims={dims} position={[0, 0, 0]} />
      <PowerPoleModel dims={dims} position={[0, 0, sep]} />

      {/* Un cable por insulator: del anclaje del poste A al mismo del poste B. */}
      {anchors.map((a, i) => (
        <Cable
          key={i}
          start={{ x: a[0], y: a[1], z: a[2] }}
          end={{ x: a[0], y: a[1], z: a[2] + sep }}
          totalLength={cab.largoCable}
          segments={cab.segmentos}
          gravity={cab.gravedad}
          lineWidth={cab.grosor}
          color={cab.color}
        />
      ))}

      <ContactShadows position={[0, 0, sep / 2]} opacity={0.5} scale={Math.max(20, sep + 12)} blur={2.6} far={6} color="#143a63" />
      <OrbitControls makeDefault target={[0, dims.upperCrossarmY - dims.crossarmGap / 2 - 4, sep / 2]} />
    </>
  )
}

export function PowerPolePlayground() {
  return (
    <Canvas
      shadows
      camera={{ position: [20, 13, 16], fov: 45 }}
      style={{ width: '100vw', height: '100vh' }}
    >
      <PowerPoleContent />
    </Canvas>
  )
}
