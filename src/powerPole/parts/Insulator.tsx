import { useMemo, useEffect } from 'react'
import { LatheGeometry, Vector2 } from 'three'
import type { Material } from 'three'
import type { ThreeElements } from '@react-three/fiber'

// Perfil del insulator de vidrio (doble falda tipo colmena): x=radio, y=altura.
// Empieza y termina en el eje (x=0) para cerrar el sólido. Lo revoluciona LatheGeometry.
const PROFILE: Vector2[] = [
  new Vector2(0.0, 0.0),
  new Vector2(0.5, 0.0), // falda inferior ancha
  new Vector2(0.5, 0.1),
  new Vector2(0.38, 0.15),
  new Vector2(0.34, 0.17),
  new Vector2(0.36, 0.33),
  new Vector2(0.45, 0.36), // segundo anillo (falda media)
  new Vector2(0.45, 0.42),
  new Vector2(0.3, 0.47),
  new Vector2(0.27, 0.62), // cuello
  new Vector2(0.29, 0.67),
  new Vector2(0.18, 0.73),
  new Vector2(0.0, 0.79), // domo del tope
]

// Insulator verde de vidrio (revolución del perfil) + pin metálico que lo fija al
// crossarm. Base en y=0 (se apoya sobre la tabla); el padre lo ubica.
export function Insulator({
  material,
  pinMaterial,
  scale = 1,
  ...props
}: ThreeElements['group'] & { material: Material; pinMaterial: Material; scale?: number }) {
  const geometry = useMemo(() => new LatheGeometry(PROFILE, 24), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <group {...props}>
      {/* Pin metálico (lo fija a la tabla). */}
      <mesh position={[0, 0.02 * scale, 0]} material={pinMaterial} castShadow>
        <cylinderGeometry args={[0.08 * scale, 0.08 * scale, 0.3 * scale, 12]} />
      </mesh>
      {/* Cuerpo de vidrio. */}
      <mesh position={[0, 0.1 * scale, 0]} scale={scale} geometry={geometry} material={material} castShadow />
    </group>
  )
}
