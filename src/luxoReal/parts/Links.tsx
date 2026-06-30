import { useMemo, useEffect } from 'react'
import type { Material } from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { buildExtruded } from '../geometry/extrudeContour'
import { LINKS_OUTER, LINKS_DEPTH } from '../profiles/linksContour'

// Placa de links (links_v1): silueta convex-hull extruida (best-effort, como los
// hinges; agujeros internos simplificados a la silueta envolvente).
export function Links({ material, ...props }: ThreeElements['group'] & { material: Material }) {
  const geometry = useMemo(() => buildExtruded(LINKS_OUTER, [], LINKS_DEPTH), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <group {...props}>
      <mesh geometry={geometry} material={material} castShadow receiveShadow />
    </group>
  )
}
