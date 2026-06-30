import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { useControls } from 'leva'
import { Lamp } from './Lamp'

export function LampContent() {
  const { shoulder, elbow, head } = useControls('Lámpara (joints)', {
    shoulder: { value: 0.6, min: -1.2, max: 1.2, step: 0.01 },
    elbow: { value: -1.1, min: -2.2, max: 0.4, step: 0.01 },
    head: { value: 0.5, min: -1.6, max: 1.6, step: 0.01 },
  })
  return (
    <>
      <color attach="background" args={['#dfe7ef']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[6, 10, 6]} intensity={2.2} />
      <Environment preset="city" />
      <Lamp joints={{ shoulder, elbow, head }} />
      <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={12} blur={2.4} far={5} />
      <OrbitControls makeDefault target={[0, 1.5, 0]} />
    </>
  )
}

export function LampScene() {
  return (
    <Canvas shadows camera={{ position: [4, 2.5, 6], fov: 50 }} style={{ width: '100vw', height: '100vh' }}>
      <LampContent />
    </Canvas>
  )
}
