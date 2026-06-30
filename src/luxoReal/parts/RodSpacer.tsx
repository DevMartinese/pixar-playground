import { useMemo, useEffect } from 'react'
import type { Material } from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { buildRevolution } from '../geometry/revolve'
import { ROD_SPACER_PROFILE } from '../profiles/rodSpacerProfile'

// Pivot rod spacer — thin washer-like piece of the pivot hardware, loose gallery piece.
export function RodSpacer({ material, ...props }: ThreeElements['group'] & { material: Material }) {
  const geometry = useMemo(() => buildRevolution(ROD_SPACER_PROFILE), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <group {...props}>
      <mesh geometry={geometry} material={material} castShadow />
    </group>
  )
}
