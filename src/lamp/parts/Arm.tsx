import { useMemo } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { buildArmGeometry } from '../geometry/armGeometry'
import { LAMP } from '../constants'

type Props = { length: number } & ThreeElements['group']

// El par comparte UNA geometría (reuso), instanciada en dos meshes separados en Z.
export function Arm({ length, ...props }: Props) {
  const geo = useMemo(() => buildArmGeometry(length), [length])
  const half = LAMP.armPairGapZ / 2
  return (
    <group {...props}>
      {[-half, half].map((z) => (
        <mesh key={z} geometry={geo} position={[0, 0, z]} castShadow receiveShadow>
          <meshStandardMaterial color="#4a4a52" roughness={0.4} metalness={0.4} />
        </mesh>
      ))}
    </group>
  )
}
