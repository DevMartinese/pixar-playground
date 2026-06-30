import { useMemo } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { buildBaseDomeGeometry } from '../geometry/baseGeometry'
import { LAMP } from '../constants'

export function Base(props: ThreeElements['group']) {
  const dome = useMemo(() => buildBaseDomeGeometry(), [])
  return (
    <group {...props}>
      <mesh geometry={dome} castShadow receiveShadow>
        <meshStandardMaterial color="#2b2b30" roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[0, LAMP.base.height + LAMP.neck.height / 2, 0]} castShadow>
        <cylinderGeometry args={[LAMP.neck.diameter / 2, LAMP.neck.diameter / 2, LAMP.neck.height, 24]} />
        <meshStandardMaterial color="#3a3a40" roughness={0.4} metalness={0.3} />
      </mesh>
    </group>
  )
}
