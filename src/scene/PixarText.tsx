import { useMemo } from 'react'
import type { Ref } from 'react'
import type { Mesh } from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { FontLoader, type FontData } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
// ?raw -> string, evita que tsc infiera el tipo literal de la fuente (~320K).
import fontRaw from '../assets/fonts/Charlemagne-Bold.json?raw'

// La fuente se parsea una vez a nivel de módulo (síncrono, sin carga async).
const font = new FontLoader().parse(JSON.parse(fontRaw) as FontData)

const TEXT = 'PIXAR'
const SIZE = 2
const GAP = 2.1 // separación extra entre letras (unidades de mundo)

// iRef expone la malla de la letra "I" para poder animarla (efecto squash).
// `depth`: grosor de la extrusión en Z (para hacer las letras más finas/gruesas).
type Props = ThreeElements['group'] & { iRef?: Ref<Mesh>; depth?: number }

// Cada letra es su propia TextGeometry: así controlamos el espaciado (TextGeometry
// no tiene letterSpacing) y alineamos la base de cada letra a y=0 para que el
// texto quede apoyado sobre el suelo.
export function PixarText({ iRef, depth = 0.5, ...props }: Props) {
  const { letters, offsetX } = useMemo(() => {
    const opts = {
      font,
      size: SIZE,
      depth,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.03,
      bevelSegments: 4,
    }
    const built = TEXT.split('').map((char) => {
      const geo = new TextGeometry(char, opts)
      geo.computeBoundingBox()
      const bb = geo.boundingBox!
      const w = bb.max.x - bb.min.x
      const d = bb.max.z - bb.min.z
      // Esquina inferior-izquierda al origen (base en y=0) y centrado en Z.
      geo.translate(-bb.min.x, -bb.min.y, -bb.min.z - d / 2)
      return { char, geo, w }
    })
    // Offsets acumulados sin mutación (n pequeño, O(n^2) trivial).
    const letters = built.map((b, i) => ({
      char: b.char,
      geo: b.geo,
      x: built.slice(0, i).reduce((s, p) => s + p.w + GAP, 0),
    }))
    const last = letters[letters.length - 1]
    const totalWidth = last.x + built[built.length - 1].w
    return { letters, offsetX: -totalWidth / 2 }
  }, [depth])

  return (
    <group {...props}>
      {letters.map(({ char, geo, x }) => (
        <mesh
          key={char}
          ref={char === 'I' ? iRef : undefined}
          geometry={geo}
          position={[offsetX + x, 0, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#000000" roughness={0.35} metalness={0.15} />
        </mesh>
      ))}
    </group>
  )
}
