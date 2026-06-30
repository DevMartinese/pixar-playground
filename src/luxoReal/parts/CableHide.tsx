import { useMemo, useEffect } from 'react'
import type { Material } from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { buildExtruded } from '../geometry/extrudeContour'
import { CABLE_HIDE_OUTER, CABLE_HIDE_HOLES, CABLE_HIDE_DEPTH } from '../profiles/cableHideContour'

// Flat cable-hide ring on the head assembly.
// Real STL (head_cable_hide_v1): Ø45.8mm × 2mm → relative Ø≈0.229 × 0.010.
// Built with buildExtruded: shape = outer contour − inner hole, extruded CABLE_HIDE_DEPTH.
export function CableHide({ material, ...props }: ThreeElements['group'] & { material: Material }) {
  const geometry = useMemo(
    () => buildExtruded(CABLE_HIDE_OUTER, CABLE_HIDE_HOLES, CABLE_HIDE_DEPTH),
    [],
  )
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <group {...props}>
      <mesh geometry={geometry} material={material} castShadow receiveShadow />
    </group>
  )
}
