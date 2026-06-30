import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { LuxoGallery } from './LuxoGallery'

// Playground para construir a Luxo (la lámpara) por partes. Mismo color e
// iluminación que la escena PIXAR; por ahora la escena está vacía: las partes se
// irán agregando dentro del grupo marcado.
export function LuxoPlaygroundContent() {
  return (
    <>
      {/* Mismo fondo que la escena PIXAR */}
      <color attach="background" args={['#64b5f6']} />

      <ambientLight intensity={0.6} />
      <directionalLight position={[6, 10, 6]} intensity={2.5} castShadow />

      <Environment preset="city" />

      {/* === Galería de piezas sueltas de Luxo (sin ensamblar) === */}
      <LuxoGallery />

      {/* Suelo que capta la sombra (igual que en PIXAR: el fondo se ve por todas
          partes y compone una sola escena). */}
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.5}
        scale={20}
        blur={2.6}
        far={5}
        color="#143a63"
      />

      <OrbitControls makeDefault target={[0, 0.45, 0]} />
    </>
  )
}

export function LuxoPlayground() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 2, 6.5], fov: 50 }}
      style={{ width: '100vw', height: '100vh' }}
    >
      <LuxoPlaygroundContent />
    </Canvas>
  )
}
