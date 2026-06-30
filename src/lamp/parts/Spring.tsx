import { useMemo } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { buildSpringGeometry } from '../geometry/springGeometry'

export function Spring(props: ThreeElements['group']) {
  const geo = useMemo(() => buildSpringGeometry(), [])
  return (
    <group {...props}>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial color="#8a8a90" roughness={0.3} metalness={0.7} />
      </mesh>
    </group>
  )
}
