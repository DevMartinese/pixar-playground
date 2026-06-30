import { useMemo, useEffect } from 'react'
import type { Material } from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { buildBaseGeometry } from '../geometry/baseGeometry'

type Props = ThreeElements['group'] & { material: Material }

// Base de Luxo ("weighted dome base" + cuello) modelada como UN solo
// LatheGeometry. Es la pieza estática y el nodo raíz del que cuelga el resto de
// la lámpara. El material gris metálico es compartido y se pasa por prop.
export function Base({ material, ...props }: Props) {
  const geometry = useMemo(() => buildBaseGeometry(), [])
  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <group {...props}>
      <mesh geometry={geometry} material={material} castShadow receiveShadow />
    </group>
  )
}
