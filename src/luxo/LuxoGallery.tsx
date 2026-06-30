import { useEffect, useMemo } from 'react'
import { MeshStandardMaterial } from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { useControls } from 'leva'
import { Base } from './parts/Base'
import { ParallelogramArm } from './parts/ParallelogramArm'
import { LampHead } from './parts/LampHead'

// Galería de piezas SUELTAS de Luxo (sin ensamblar a la lámpara final; de eso se
// encarga el usuario). Cada pieza, centrada en su propio origen, se dispone lado
// a lado a lo largo de X. Material gris metálico ÚNICO, compartido por todas.
export function LuxoGallery(props: ThreeElements['group']) {
  const material = useMemo(
    () => new MeshStandardMaterial({ color: '#b9bbc1', metalness: 0.7, roughness: 0.35 }),
    [],
  )
  useEffect(() => () => material.dispose(), [material])

  // Input θ del paralelogramo (acotado para no aplanarlo del todo en 0/π).
  const { theta } = useControls('Brazo paralelogramo', {
    theta: { value: 1.2, min: 0.2, max: 2.9, step: 0.01, label: 'θ (rad)' },
  })

  return (
    <group {...props}>
      {/* Base (Ø1.0), apoyada en el suelo. */}
      <Base material={material} position={[-1.2, 0, 0]} />

      {/* Brazo paralelogramo four-bar (compacto, fiel al print ≈0.37 c-c): P1 en
          su origen; lo corremos para centrarlo en su hueco y lo elevamos. */}
      <ParallelogramArm material={material} theta={theta} position={[-0.25, 0.25, 0]} />

      {/* Cabeza + head pivot, centrada en su origen, elevada. */}
      <LampHead material={material} position={[1.2, 0.5, 0]} />
    </group>
  )
}
