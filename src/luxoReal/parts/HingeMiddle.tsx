import { useMemo, useEffect } from 'react'
import type { Material } from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { buildExtruded } from '../geometry/extrudeContour'
import { HINGE_MIDDLE_OUTER, HINGE_MIDDLE_DEPTH } from '../profiles/hingeMiddleContour'

// Middle hinge — middle joint of the Luxo lamp arm.
// Real STL (hinge_middle_left_v1): convex-hull silhouette of the real geometry.
// Hinge knuckles & pin holes simplified to the envelope silhouette, extruded with true thickness.
export function HingeMiddle({ material, ...props }: ThreeElements['group'] & { material: Material }) {
  const geometry = useMemo(
    () => buildExtruded(HINGE_MIDDLE_OUTER, [], HINGE_MIDDLE_DEPTH),
    [],
  )
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <group {...props}>
      <mesh geometry={geometry} material={material} castShadow receiveShadow />
    </group>
  )
}
