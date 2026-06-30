import { useMemo, useEffect } from 'react'
import type { BufferGeometry, Material, Vector2 } from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { buildArmBarGeometry } from '../geometry/armBarGeometry'
import { buildSpringGeometry } from '../geometry/springGeometry'
import { solveLinkage } from '../geometry/solveLinkage'
import {
  MAIN_BAR_LENGTH,
  MAIN_BAR_WIDTH,
  CONTROL_BAR_LENGTH,
  CONTROL_BAR_WIDTH,
  BAR_Z_GAP,
  PIVOT_HOLE_DIAMETER,
  DIAGONAL_SPRING_REST_LENGTH,
} from '../dimensions'

type Props = ThreeElements['group'] & { material: Material; theta: number }

const HALF_GAP = BAR_Z_GAP / 2 // 0.1 → cada barra doble en z = ±0.1
const PIN_R = PIVOT_HOLE_DIAMETER / 2 // 0.075
const PIN_LEN = 0.2 // largo del pin (real: rod ≈44.8mm/200; asoma del stack de barras)

// Ángulo Z para alinear el +Y local de la barra (su largo) con la dirección a→b.
function barAngle(a: Vector2, b: Vector2): number {
  return Math.atan2(b.y - a.y, b.x - a.x) - Math.PI / 2
}

// Barra doble (instancia la misma geometría en z = ±0.1), tendida entre dos
// pivotes a y b (sigue a sus pivotes; no se anima por separado).
function DoubleBar({
  geometry,
  material,
  a,
  b,
}: {
  geometry: BufferGeometry
  material: Material
  a: Vector2
  b: Vector2
}) {
  return (
    <group position={[(a.x + b.x) / 2, (a.y + b.y) / 2, 0]} rotation={[0, 0, barAngle(a, b)]}>
      <mesh geometry={geometry} material={material} position={[0, 0, HALF_GAP]} castShadow receiveShadow />
      <mesh geometry={geometry} material={material} position={[0, 0, -HALF_GAP]} castShadow receiveShadow />
    </group>
  )
}

// Paralelogramo articulado four-bar como pieza suelta. La geometría de las barras
// y del resorte se construye UNA vez (useMemo); θ sólo recalcula las posiciones
// de los pivotes (solveLinkage) y los transforms de las barras — NO regenera
// geometría. Se pliega/despliega con el slider de θ y mantiene el output (P2–P3)
// orientado.
export function ParallelogramArm({ material, theta, ...props }: Props) {
  const mainGeo = useMemo(() => buildArmBarGeometry(MAIN_BAR_LENGTH, MAIN_BAR_WIDTH), [])
  // Control bars CON agujero real: con el pivote fiel (Ø0.08) ya entra en el
  // ancho 0.1 (radio 0.0425 < medio ancho 0.05).
  const controlGeo = useMemo(
    () => buildArmBarGeometry(CONTROL_BAR_LENGTH, CONTROL_BAR_WIDTH),
    [],
  )
  const springGeo = useMemo(() => buildSpringGeometry(), [])
  useEffect(
    () => () => {
      mainGeo.dispose()
      controlGeo.dispose()
      springGeo.dispose()
    },
    [mainGeo, controlGeo, springGeo],
  )

  // Restricción cinemática: sólo transforms dependen de θ.
  const { p1, p2, p3, p4 } = solveLinkage(theta)
  const pivots = [
    { key: 'p1', p: p1 },
    { key: 'p2', p: p2 },
    { key: 'p3', p: p3 },
    { key: 'p4', p: p4 },
  ]

  // Resorte diagonal P1→P3: se estira/comprime con θ escalando en Y.
  const diag = Math.hypot(p3.x - p1.x, p3.y - p1.y)
  const springAngle = barAngle(p1, p3)
  const springScaleY = diag / DIAGONAL_SPRING_REST_LENGTH

  return (
    <group {...props}>
      {/* Barras principales: P1–P4 (FIXED LINK) y P2–P3 (OUTPUT LINK). */}
      <DoubleBar geometry={mainGeo} material={material} a={p1} b={p4} />
      <DoubleBar geometry={mainGeo} material={material} a={p2} b={p3} />

      {/* Barras de control / tie-rods: P1–P2 y P4–P3. */}
      <DoubleBar geometry={controlGeo} material={material} a={p1} b={p2} />
      <DoubleBar geometry={controlGeo} material={material} a={p4} b={p3} />

      {/* Pivot pins Ø0.15 a lo largo de Z, uno por esquina. */}
      {pivots.map(({ key, p }) => (
        <mesh
          key={key}
          position={[p.x, p.y, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          material={material}
          castShadow
        >
          <cylinderGeometry args={[PIN_R, PIN_R, PIN_LEN, 20]} />
        </mesh>
      ))}

      {/* Resorte diagonal de tensión (P1→P3). Decorativo; sus extremos siguen a
          los pivotes al plegarse (estira/comprime, aproximado). */}
      <group position={[p1.x, p1.y, 0]} rotation={[0, 0, springAngle]} scale={[1, springScaleY, 1]}>
        <mesh geometry={springGeo} material={material} castShadow />
      </group>
    </group>
  )
}
