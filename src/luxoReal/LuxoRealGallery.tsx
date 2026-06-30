import { useEffect, useMemo } from 'react'
import { MeshStandardMaterial } from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { MATERIAL_COLOR, MATERIAL_METALNESS, MATERIAL_ROUGHNESS } from './dimensions'
import { Foot } from './parts/Foot'
import { Head } from './parts/Head'
import { HeadNeck } from './parts/HeadNeck'
import { CableHide } from './parts/CableHide'
import { Reflector } from './parts/Reflector'
import { Link } from './parts/Link'
import { Section } from './parts/Section'
import { Links } from './parts/Links'
import { BoxSections } from './parts/BoxSections'
import { Rod } from './parts/Rod'
import { RodCap } from './parts/RodCap'
import { RodSpacer } from './parts/RodSpacer'
import { RodButton } from './parts/RodButton'
import { HingeBottom } from './parts/HingeBottom'
import { HingeMiddle } from './parts/HingeMiddle'
import { HingeTop } from './parts/HingeTop'
import { Bulb } from './parts/Bulb'
import { LedSupport } from './parts/LedSupport'

// Galería de piezas SUELTAS de la Luxo fiel a STL. Material gris único compartido.
// Las piezas se agregan acá a medida que se construyen.
export function LuxoRealGallery(props: ThreeElements['group']) {
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: MATERIAL_COLOR,
        metalness: MATERIAL_METALNESS,
        roughness: MATERIAL_ROUGHNESS,
      }),
    [],
  )
  useEffect(() => () => material.dispose(), [material])

  return (
    <group {...props}>
      {/* Galería en grilla por familias. Cada pieza centrada en su propio origen.
          El ensamblado final lo hace el usuario. */}

      {/* Fila 1 (frente, z=1.6): revoluciones grandes — foot, head, reflector. */}
      <Foot material={material} position={[-1.6, 0, 1.6]} />
      <Head material={material} position={[0, 0, 1.6]} />
      <Reflector material={material} position={[1.5, 0.3, 1.6]} />

      {/* Fila 2 (medio, z=0): brazos planos + placas + sub-piezas de cabeza + LED.
          links_v1 / box_sections: silueta convex-hull (best-effort, como los hinges;
          agujeros internos simplificados). */}
      <Link material={material} position={[-2.7, 0.4, 0]} />
      <Section material={material} position={[-2.0, 0.4, 0]} />
      <Links material={material} position={[-1.2, 0.4, 0]} />
      <BoxSections material={material} position={[-0.4, 0.4, 0]} />
      <HeadNeck material={material} position={[0.3, 0.1, 0]} />
      <CableHide material={material} position={[0.8, 0.4, 0]} />
      <Bulb material={material} position={[1.5, 0.25, 0]} />
      <LedSupport material={material} position={[2.3, 0.25, 0]} />

      {/* Fila 3 (atrás, z=-1.5): hinges + pivotería (siluetas/piezas chicas). */}
      <HingeBottom material={material} position={[-2.0, 0.4, -1.5]} />
      <HingeMiddle material={material} position={[-1.0, 0.4, -1.5]} />
      <HingeTop material={material} position={[0.0, 0.4, -1.5]} />
      <Rod material={material} position={[0.9, 0.2, -1.5]} />
      <RodCap material={material} position={[1.3, 0.2, -1.5]} />
      <RodSpacer material={material} position={[1.6, 0.2, -1.5]} />
      <RodButton material={material} position={[1.9, 0.2, -1.5]} />
    </group>
  )
}
