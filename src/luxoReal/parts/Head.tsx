import { useMemo, useEffect } from 'react'
import { DoubleSide } from 'three'
import type { Material } from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { buildHeadGeometry } from '../geometry/headVents'

// Shade hueco de la cabeza Luxo: revolución del perfil real (boca ABIERTA) + 12
// ranuras de ventilación (CSG SUBTRACTION). Se renderiza DoubleSide para ver la
// pared interior por la boca abierta. Geometría con Y ∈ [~0, ~0.642].
export function Head({ material, ...props }: ThreeElements['group'] & { material: Material }) {
  const geometry = useMemo(() => buildHeadGeometry(), [])
  // Pantalla abierta → DoubleSide (se ve por dentro y por fuera).
  const shadeMaterial = useMemo(() => {
    const m = material.clone()
    m.side = DoubleSide
    return m
  }, [material])
  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => shadeMaterial.dispose(), [shadeMaterial])
  return (
    <group {...props}>
      <mesh geometry={geometry} material={shadeMaterial} castShadow receiveShadow />
    </group>
  )
}
