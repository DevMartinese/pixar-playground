import { Vector3, Quaternion } from 'three'
import type { Material } from 'three'
import type { ThreeElements } from '@react-three/fiber'

// Travesaño (crossarm): DOS tablas paralelas que abrazan el poste (adelante/atrás,
// como en las vistas side/top) + un perno pasante en Z. Se construye centrado en
// el origen local; el padre lo ubica a su altura.
export function Crossarm({
  material,
  boltMaterial,
  length,
  height,
  depth,
  postRadius,
  boltRadius,
  ...props
}: ThreeElements['group'] & {
  material: Material
  boltMaterial: Material
  length: number
  height: number
  depth: number
  postRadius: number
  boltRadius: number
}) {
  const zBoard = postRadius + depth / 2 // cada tabla pegada a la cara del poste
  // Perno horizontal (a lo largo de Z): cilindro rotado 90° en X.
  const boltLen = 2 * zBoard + 0.25
  const boltQuat = new Quaternion()
    .setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(0, 0, 1))
    .toArray() as [number, number, number, number]
  return (
    <group {...props}>
      {/* Dos tablas (frente y fondo). */}
      <mesh position={[0, 0, zBoard]} material={material} castShadow receiveShadow>
        <boxGeometry args={[length, height, depth]} />
      </mesh>
      <mesh position={[0, 0, -zBoard]} material={material} castShadow receiveShadow>
        <boxGeometry args={[length, height, depth]} />
      </mesh>
      {/* Perno pasante central + cabezas. */}
      <mesh quaternion={boltQuat} material={boltMaterial} castShadow>
        <cylinderGeometry args={[boltRadius, boltRadius, boltLen, 12]} />
      </mesh>
      {[zBoard + 0.12, -(zBoard + 0.12)].map((z) => (
        <mesh key={z} position={[0, 0, z]} quaternion={boltQuat} material={boltMaterial} castShadow>
          <cylinderGeometry args={[boltRadius * 1.7, boltRadius * 1.7, 0.06, 12]} />
        </mesh>
      ))}
    </group>
  )
}
