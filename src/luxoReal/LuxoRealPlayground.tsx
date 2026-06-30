import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { LuxoRealGallery } from './LuxoRealGallery'

export function LuxoRealPlaygroundContent() {
  return (
    <>
      <color attach="background" args={['#64b5f6']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[6, 10, 6]} intensity={2.5} castShadow />
      <Environment preset="city" />
      <LuxoRealGallery />
      <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={20} blur={2.6} far={5} color="#143a63" />
      <OrbitControls makeDefault target={[0, 0.35, 0.2]} />
    </>
  )
}

export function LuxoRealPlayground() {
  return (
    <Canvas shadows camera={{ position: [0, 3.2, 7], fov: 50 }} style={{ width: '100vw', height: '100vh' }}>
      <LuxoRealPlaygroundContent />
    </Canvas>
  )
}
