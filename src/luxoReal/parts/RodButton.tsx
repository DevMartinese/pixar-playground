import { useMemo, useEffect } from 'react'
import type { Material } from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { buildRevolution } from '../geometry/revolve'
import { ROD_BUTTON_PROFILE } from '../profiles/rodButtonProfile'

// Pivot rod head button — rounded button piece of the pivot hardware, loose gallery piece.
export function RodButton({ material, ...props }: ThreeElements['group'] & { material: Material }) {
  const geometry = useMemo(() => buildRevolution(ROD_BUTTON_PROFILE), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <group {...props}>
      <mesh geometry={geometry} material={material} castShadow />
    </group>
  )
}
