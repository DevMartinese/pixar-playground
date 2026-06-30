import { useMemo, useRef } from 'react'
import type { Ref } from 'react'
import { DataTexture, RGBAFormat, AdditiveBlending } from 'three'
import type { Mesh } from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { useControls } from 'leva'
import { PixarText } from './PixarText'
import { JumperFixed } from './JumperFixed'
import { JumperLampFixed } from './JumperLampFixed'
import { useJumpDebug } from './useJumpDebug'

// Textura radial (blanco al centro → transparente) para el charco de luz aditivo
// que la lámpara proyecta en el piso. DataTexture procedural (sin canvas → tests ok).
function createPoolTexture(size = 128): DataTexture {
  const data = new Uint8Array(size * size * 4)
  const c = (size - 1) / 2
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - c) / c
      const dy = (y - c) / c
      const r = Math.sqrt(dx * dx + dy * dy)
      const falloff = Math.max(0, 1 - r)
      const a = falloff * falloff // borde suave, centro lleno
      const i = (y * size + x) * 4
      data[i] = 255
      data[i + 1] = 255
      data[i + 2] = 255
      data[i + 3] = Math.round(a * 255)
    }
  }
  const tex = new DataTexture(data, size, size, RGBAFormat)
  tex.needsUpdate = true
  return tex
}

// Sandbox /fixar: clon EXACTO de la escena PIXAR, pero usa los jumpers que importan
// `jumpAnimationFixed` → ahí se desarrolla el FIX del bop sin tocar la ruta /.
type SceneProps = { iRef?: Ref<Mesh>; onReplay?: () => void }

export function FixarContent({ iRef, onReplay }: SceneProps) {
  // Elegí qué objeto salta cruzando el texto: el cilindro rojo o la Luxo.
  const { objeto } = useControls('Objeto que salta', {
    objeto: { value: 'cilindro', options: ['cilindro', 'lámpara'], label: 'objeto' },
  })
  // Grosor (extrusión en Z) de las letras: para hacerlas más finas o gruesas.
  const { grosor } = useControls('Letras', {
    grosor: { value: 0.5, min: 0.05, max: 1, step: 0.01, label: 'grosor' },
  })
  // Panel debug: tunea TODA la coreografía en vivo + ▶ repetir / 📋 copiar config +
  // timeline (reproducir/pausar/scrub). `tlRef` recibe el timeline del jumper activo.
  const { choreo, replayKey, tlRef, lampPose, bodyYaw, stateRef, light } = useJumpDebug(onReplay)
  // Getter de la malla de la "I" (para que el saltarín la aplaste al llegar).
  const getI = () => (iRef && typeof iRef !== 'function' ? iRef.current : null)
  // Charco de luz en el piso: el mesh vive acá (espacio mundo, sin transform) y la
  // lámpara lo posiciona/atenúa cada frame proyectando el eje del foco al suelo.
  const poolRef = useRef<Mesh>(null)
  const poolTex = useMemo(() => createPoolTexture(), [])
  return (
    <>
      <color attach="background" args={['#64b5f6']} />

      <ambientLight intensity={0.6} />
      <directionalLight position={[6, 10, 6]} intensity={2.5} />

      <Environment preset="city" />

      {/* Letras apoyadas sobre el suelo (base en y=0) */}
      <PixarText position={[0, 0, 0]} iRef={iRef} depth={grosor} />

      {/* Objeto que salta cruzando el texto (cilindro o lámpara, elegible por Leva).
          Se ubica en el borde derecho (x≈+7.55) rotado 180° en Y: su recorrido
          interno (avanza en +x, ≈15.2 ≈ ancho del texto) se mapea a -x → cruza de
          la R a la P. */}
      {objeto === 'lámpara' ? (
        <JumperLampFixed position={[7.55, 0, 1.8]} rotation={[0, Math.PI, 0]} getI={getI} choreo={choreo} replayKey={replayKey} tlRef={tlRef} pose={lampPose} bodyYaw={bodyYaw} stateRef={stateRef} light={light} floorPoolRef={poolRef} />
      ) : (
        <JumperFixed position={[7.55, 0, 1.8]} rotation={[0, Math.PI, 0]} getI={getI} choreo={choreo} replayKey={replayKey} tlRef={tlRef} stateRef={stateRef} />
      )}

      {/* Plano INVISIBLE a ras del piso: escribe profundidad pero NO color
          (colorWrite=false) → no cambia el aspecto del suelo, pero recorta por
          z-test los fragmentos del cono volumétrico del foco que caen por debajo
          de y=0. Así la luz "frena en el piso" en vez de atravesarlo. renderOrder
          bajo + opaco → se dibuja antes que el cono (transparente) y deja su
          profundidad lista para el test. y=-0.01 para no pelear con la sombra.
          ACOTADO (40×40): cubre toda la zona de acción pero su borde queda MUY por
          debajo del horizonte → no llega al fondo, así el fondo no corta el cono. */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial colorWrite={false} />
      </mesh>

      {/* Charco de luz aditivo: la lámpara lo mueve/escala/atenúa por frame (ref). Sin
          driver (objeto = cilindro) queda invisible. Aditivo → suma brillo cálido sobre
          el piso sin tapar el fondo; depthTest → las letras lo ocluyen correctamente. */}
      <mesh ref={poolRef} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={poolTex} transparent opacity={0} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
      </mesh>

      {/* Sombra de contacto sobre una "alfombra" GRANDE (scale 80): su borde queda
          fuera de cuadro → la sombra no se corta en una línea dura (se ve infinita).
          Más resolución para no perder nitidez al agrandar. El fondo se ve a través. */}
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.5}
        scale={80}
        resolution={1024}
        blur={3}
        far={5}
        color="#143a63"
      />

      {/* Permite bajar bastante (vista baja estilo Pixar) pero no por debajo del
          plano de sombra (evita ver su cara inferior). */}
      <OrbitControls makeDefault target={[0, 0.8, 0]} maxPolarAngle={Math.PI / 2.05} />
    </>
  )
}

export function FixarScene({ iRef, onReplay }: SceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 3, 11], fov: 50 }}
      style={{ width: '100vw', height: '100vh' }}
    >
      <FixarContent iRef={iRef} onReplay={onReplay} />
    </Canvas>
  )
}
