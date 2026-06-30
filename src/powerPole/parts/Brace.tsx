import { useMemo } from 'react'
import { Vector3, Quaternion } from 'three'
import type { Material } from 'three'

type Vec3 = [number, number, number]

// Caja fina que conecta dos puntos 3D (a → b): calcula largo, punto medio y la
// rotación que alinea el eje Y local con la dirección. Sirve para los braces
// diagonales (y cualquier travesaño/perno orientado).
export function Strut({
  a,
  b,
  thickness,
  material,
}: {
  a: Vec3
  b: Vec3
  thickness: number
  material: Material
}) {
  const { pos, len, quat } = useMemo(() => {
    const A = new Vector3(...a)
    const B = new Vector3(...b)
    const dir = new Vector3().subVectors(B, A)
    const length = dir.length()
    const mid = new Vector3().addVectors(A, B).multiplyScalar(0.5)
    const q = new Quaternion().setFromUnitVectors(
      new Vector3(0, 1, 0),
      dir.clone().normalize(),
    )
    return { pos: mid.toArray() as Vec3, len: length, quat: q.toArray() as [number, number, number, number] }
  }, [a, b])
  return (
    <mesh position={pos} quaternion={quat} material={material} castShadow>
      <boxGeometry args={[thickness, len, thickness]} />
    </mesh>
  )
}
