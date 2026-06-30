import { useMemo, useEffect } from 'react'
import type { Material } from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { buildExtruded } from '../geometry/extrudeContour'
import { HINGE_TOP_OUTER, HINGE_TOP_DEPTH } from '../profiles/hingeTopContour'

// Top hinge — upper joint of the Luxo lamp arm.
// Real STL (hinge_top_left_v1): convex-hull silhouette of the real geometry.
// Hinge knuckles & pin holes simplified to the envelope silhouette, extruded with true thickness.
export function HingeTop({ material, ...props }: ThreeElements['group'] & { material: Material }) {
  const geometry = useMemo(
    () => buildExtruded(HINGE_TOP_OUTER, [], HINGE_TOP_DEPTH),
    [],
  )
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <group {...props}>
      <mesh geometry={geometry} material={material} castShadow receiveShadow />
    </group>
  )
}
