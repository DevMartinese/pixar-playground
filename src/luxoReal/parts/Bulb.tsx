import { useMemo, useEffect } from 'react'
import type { Material } from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { buildRevolution } from '../geometry/revolve'
import { BULB_PROFILE } from '../profiles/bulbProfile'

// LED bulb, revolution of the real profile from bulb_light_v1.
export function Bulb({ material, ...props }: ThreeElements['group'] & { material: Material }) {
  const geometry = useMemo(() => buildRevolution(BULB_PROFILE), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <group {...props}>
      <mesh geometry={geometry} material={material} castShadow receiveShadow />
    </group>
  )
}
