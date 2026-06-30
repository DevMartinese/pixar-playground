import { useMemo, useEffect } from 'react'
import type { Material } from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { buildExtruded } from '../geometry/extrudeContour'
import { LINK_OUTER, LINK_HOLES, LINK_DEPTH } from '../profiles/linkContour'

// Flat link bar — arm segment connecting the head assembly to the base.
// Real STL (link_front_v1): stadium 0.438×0.070, 2 holes Ø0.06.
// Built with buildExtruded: shape = outer contour − holes, extruded LINK_DEPTH.
export function Link({ material, ...props }: ThreeElements['group'] & { material: Material }) {
  const geometry = useMemo(
    () => buildExtruded(LINK_OUTER, LINK_HOLES, LINK_DEPTH),
    [],
  )
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <group {...props}>
      <mesh geometry={geometry} material={material} castShadow receiveShadow />
    </group>
  )
}
