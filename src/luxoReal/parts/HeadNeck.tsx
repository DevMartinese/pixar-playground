import { useMemo, useEffect } from 'react'
import type { Material } from 'three'
import { CylinderGeometry } from 'three'
import type { ThreeElements } from '@react-three/fiber'

// Neck cylinder connecting the head shade to the arm assembly.
// Real STL (head_neck_v1): Ø12mm × 35.2mm → relative: Ø0.06 × 0.176.
// NOTE: The real STL neck axis is tilted ~50° from vertical; this piece is
// modeled straight here. Apply the tilt in your assembly/group.
const NECK_RADIUS = 0.03 // 6mm / 199.98
const NECK_LENGTH = 0.176 // 35.2mm / 199.98

export function HeadNeck({ material, ...props }: ThreeElements['group'] & { material: Material }) {
  const geometry = useMemo(() => new CylinderGeometry(NECK_RADIUS, NECK_RADIUS, NECK_LENGTH, 32), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <group {...props}>
      <mesh geometry={geometry} material={material} castShadow receiveShadow />
    </group>
  )
}
