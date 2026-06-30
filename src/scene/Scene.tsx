import type { Ref } from 'react'
import type { Mesh } from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { useControls } from 'leva'
import { PixarText } from './PixarText'
import { Jumper } from './Jumper'
import { JumperLamp } from './JumperLamp'
import { useJumpDebug } from './useJumpDebug'

type SceneProps = { iRef?: Ref<Mesh>; onReplay?: () => void }

export function SceneContent({ iRef, onReplay }: SceneProps) {
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
        <JumperLamp position={[7.55, 0, 1.8]} rotation={[0, Math.PI, 0]} getI={getI} choreo={choreo} replayKey={replayKey} tlRef={tlRef} pose={lampPose} bodyYaw={bodyYaw} stateRef={stateRef} light={light} />
      ) : (
        <Jumper position={[7.55, 0, 1.8]} rotation={[0, Math.PI, 0]} getI={getI} choreo={choreo} replayKey={replayKey} tlRef={tlRef} stateRef={stateRef} />
      )}

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

export function Scene({ iRef, onReplay }: SceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 3, 11], fov: 50 }}
      style={{ width: '100vw', height: '100vh' }}
    >
      <SceneContent iRef={iRef} onReplay={onReplay} />
    </Canvas>
  )
}
