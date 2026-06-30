import { useMemo, useEffect } from 'react'
import { DoubleSide } from 'three'
import type { Material } from 'three'
import type { ThreeElements } from '@react-three/fiber'

// Inner reflector cone inside the head shade. Approximate geometry (no separate
// STL); proportional to the HEAD_PROFILE (rMax≈0.387, height≈0.642).
// Rendered open-ended with DoubleSide so it is visible from inside and outside.
// args: [topRadius, bottomRadius, height, radialSegments, heightSegments, openEnded]
// bottomRadius 0.34 ≈ inner mouth; topRadius 0.08 ≈ inner top; height 0.5.
export function Reflector({ material, ...props }: ThreeElements['group'] & { material: Material }) {
  // Clone the material and set DoubleSide so the cone interior is visible.
  const coneMaterial = useMemo(() => {
    const m = material.clone()
    m.side = DoubleSide
    return m
  }, [material])
  useEffect(() => () => coneMaterial.dispose(), [coneMaterial])

  return (
    <group {...props}>
      <mesh material={coneMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.08, 0.34, 0.5, 48, 1, true]} />
      </mesh>
    </group>
  )
}
