import { useMemo, useEffect } from 'react'
import type { Material } from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { buildRevolution } from '../geometry/revolve'
import { ROD_PROFILE } from '../profiles/rodProfile'

// Pivot rod — one of three parallel rods in the real rods_v1 assembly. This is a loose gallery piece.
// The real rods_v1 is 3 parallel rods; this component renders one rod, typically instanced ×3 by the user.
export function Rod({ material, ...props }: ThreeElements['group'] & { material: Material }) {
  const geometry = useMemo(() => buildRevolution(ROD_PROFILE), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <group {...props}>
      <mesh geometry={geometry} material={material} castShadow />
    </group>
  )
}
