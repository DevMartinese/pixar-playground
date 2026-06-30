import { useMemo, useEffect } from 'react'
import type { Material } from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { buildExtruded } from '../geometry/extrudeContour'
import { SECTION_OUTER, SECTION_HOLES, SECTION_DEPTH } from '../profiles/sectionContour'

// Flat section bar — arm segment connecting multiple links.
// Real STL (section_left_v1): stadium 0.458×0.078, 2 holes Ø0.06.
// Built with buildExtruded: shape = outer contour − holes, extruded SECTION_DEPTH.
export function Section({ material, ...props }: ThreeElements['group'] & { material: Material }) {
  const geometry = useMemo(
    () => buildExtruded(SECTION_OUTER, SECTION_HOLES, SECTION_DEPTH),
    [],
  )
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <group {...props}>
      <mesh geometry={geometry} material={material} castShadow receiveShadow />
    </group>
  )
}
