import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { LuxoLampAssembled } from './LuxoLampAssembled'

export function LuxoArmadaContent() {
  return (
    <>
      <color attach="background" args={['#64b5f6']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[6, 10, 6]} intensity={2.5} castShadow />
      <Environment preset="city" />
      <LuxoLampAssembled />
      <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={6} blur={2.6} far={3} color="#143a63" />
      <OrbitControls makeDefault target={[0, 0.6, 0]} />
    </>
  )
}

export function LuxoArmadaPlayground() {
  return (
    <Canvas shadows camera={{ position: [1.6, 1.2, 2.4], fov: 50 }} style={{ width: '100vw', height: '100vh' }}>
      <LuxoArmadaContent />
    </Canvas>
  )
}
