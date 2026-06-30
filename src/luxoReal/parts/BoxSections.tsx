import { useMemo, useEffect } from 'react'
import type { Material } from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { buildExtruded } from '../geometry/extrudeContour'
import { BOX_SECTIONS_OUTER, BOX_SECTIONS_DEPTH } from '../profiles/boxSectionsContour'

// Conector de secciones (box_sections_v1): silueta convex-hull extruida
// (best-effort, como los hinges; agujeros internos simplificados).
export function BoxSections({ material, ...props }: ThreeElements['group'] & { material: Material }) {
  const geometry = useMemo(() => buildExtruded(BOX_SECTIONS_OUTER, [], BOX_SECTIONS_DEPTH), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <group {...props}>
      <mesh geometry={geometry} material={material} castShadow receiveShadow />
    </group>
  )
}
