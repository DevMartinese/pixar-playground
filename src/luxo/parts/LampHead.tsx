import { useMemo, useEffect } from 'react'
import { DoubleSide } from 'three'
import type { Material } from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { buildHeadShadeGeometry } from '../geometry/headShadeGeometry'
import {
  HEAD_HEIGHT,
  HEAD_PIVOT_DIAMETER,
  REFLECTOR_GAP,
  REFLECTOR_HEIGHT,
  REFLECTOR_OD,
  REFLECTOR_TOP_OD,
} from '../dimensions'

type Props = ThreeElements['group'] & { material: Material }

// Cabeza de Luxo (lamp head) + head pivot, como pieza aislada centrada en su
// origen. Es la pieza con más CSG: el shade hueco con 12 vents pasantes se arma
// en un solo useMemo (buildHeadShadeGeometry). Adentro, un cono reflector
// (openEnded, DoubleSide). Atrás-arriba, el perno del head pivot (eje Z).
export function LampHead({ material, ...props }: Props) {
  const shadeGeo = useMemo(() => buildHeadShadeGeometry(), [])
  useEffect(() => () => shadeGeo.dispose(), [shadeGeo])

  // Reflector: mismo material gris pero DoubleSide (se ve por dentro y por fuera).
  const coneMaterial = useMemo(() => {
    const m = material.clone()
    m.side = DoubleSide
    return m
  }, [material])
  useEffect(() => () => coneMaterial.dispose(), [coneMaterial])

  const pivotR = HEAD_PIVOT_DIAMETER / 2 // 0.075
  // Reflector recesado dentro de la boca por REFLECTOR_GAP; centrado en su alto.
  const reflectorY = -HEAD_HEIGHT / 2 + REFLECTOR_GAP + REFLECTOR_HEIGHT / 2

  return (
    <group {...props}>
      {/* Outer shade hueco (Ø boca 0.80 → top 0.25, alto 0.70, pared 0.025) con
          12 vents pasantes — todo CSG en buildHeadShadeGeometry. */}
      <mesh geometry={shadeGeo} material={material} castShadow receiveShadow />

      {/* Inner reflector cone: openEnded (OD 0.75 abajo → angosto arriba, alto
          0.65), recesado gap 0.01. Sin CSG: openEnded simple. */}
      <mesh position={[0, reflectorY, 0]} material={coneMaterial}>
        <cylinderGeometry
          args={[REFLECTOR_TOP_OD / 2, REFLECTOR_OD / 2, REFLECTOR_HEIGHT, 48, 1, true]}
        />
      </mesh>

      {/* Head pivot: perno Ø0.15, eje a lo largo de Z (head tilt axis), atrás-arriba
          del shade. // → conecta con upper arm (head pivot). */}
      <mesh position={[-0.14, 0.22, 0]} rotation={[Math.PI / 2, 0, 0]} material={material} castShadow>
        <cylinderGeometry args={[pivotR, pivotR, 0.34, 24]} />
      </mesh>
    </group>
  )
}
