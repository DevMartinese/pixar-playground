import { useMemo, useEffect } from 'react'
import type { Material } from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { buildRevolution } from '../geometry/revolve'
import { ROD_CAP_PROFILE } from '../profiles/rodCapProfile'

// Pivot rod cap — small revolving cap piece of the pivot hardware, loose gallery piece.
export function RodCap({ material, ...props }: ThreeElements['group'] & { material: Material }) {
  const geometry = useMemo(() => buildRevolution(ROD_CAP_PROFILE), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <group {...props}>
      <mesh geometry={geometry} material={material} castShadow />
    </group>
  )
}
