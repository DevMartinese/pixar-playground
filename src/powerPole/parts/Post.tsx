import type { Material } from 'three'
import type { ThreeElements } from '@react-three/fiber'

// Poste principal: cilindro vertical con base en y=0 y tope redondeado (domo).
export function Post({
  material,
  height,
  radius,
  ...props
}: ThreeElements['group'] & { material: Material; height: number; radius: number }) {
  return (
    <group {...props}>
      {/* Cuerpo: centrado en height/2 para apoyar la base en y=0. */}
      <mesh position={[0, height / 2, 0]} material={material} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius * 1.05, height, 24]} />
      </mesh>
      {/* Domo del tope (media esfera achatada). */}
      <mesh position={[0, height, 0]} scale={[1, 0.6, 1]} material={material} castShadow>
        <sphereGeometry args={[radius, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
    </group>
  )
}
