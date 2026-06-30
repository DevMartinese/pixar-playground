import { useMemo } from 'react'
import { DoubleSide } from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { buildHeadGeometry } from '../geometry/headGeometry'
import { buildReflectorGeometry } from '../geometry/reflectorGeometry'
import { LAMP } from '../constants'

export function Head(props: ThreeElements['group']) {
  const headGeo = useMemo(() => buildHeadGeometry(), [])
  const reflectorGeo = useMemo(() => buildReflectorGeometry(), [])
  return (
    <group {...props}>
      <mesh geometry={headGeo} castShadow receiveShadow>
        <meshStandardMaterial color="#d8d8dc" roughness={0.35} metalness={0.5} />
      </mesh>
      <mesh geometry={reflectorGeo}>
        <meshStandardMaterial color="#f4f4f0" roughness={0.2} metalness={0.1} side={DoubleSide} />
      </mesh>
      <mesh position={[0, -LAMP.head.height / 2 + 0.18, 0]}>
        <sphereGeometry args={[LAMP.bulb.radius, 24, 24]} />
        <meshStandardMaterial color="#fff6cc" emissive="#ffe9a3" emissiveIntensity={0.6} />
      </mesh>
    </group>
  )
}
