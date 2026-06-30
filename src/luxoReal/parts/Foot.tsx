import { useMemo, useEffect } from 'react'
import type { Material } from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { buildRevolution } from '../geometry/revolve'
import { FOOT_PROFILE } from '../profiles/footProfile'

// Base/foot of the Luxo, revolution of the real profile from foot_v1. Resting on y=0.
export function Foot({ material, ...props }: ThreeElements['group'] & { material: Material }) {
  const geometry = useMemo(() => buildRevolution(FOOT_PROFILE), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <group {...props}>
      <mesh geometry={geometry} material={material} castShadow receiveShadow />
    </group>
  )
}
