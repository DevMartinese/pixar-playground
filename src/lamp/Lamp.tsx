import type { ThreeElements } from '@react-three/fiber'
import { Base } from './parts/Base'
import { Arm } from './parts/Arm'
import { Head } from './parts/Head'
import { Spring } from './parts/Spring'
import { LAMP } from './constants'

export type JointAngles = { shoulder: number; elbow: number; head: number }

// Pose de reposo (radianes) afinada contra la vista lateral del blueprint.
const REST: JointAngles = { shoulder: 0.6, elbow: -1.1, head: 0.5 }

type Props = { joints?: Partial<JointAngles> } & ThreeElements['group']

// Brazo que nace en el origen del grupo y se extiende `length` hacia +Y.
// (Arm dibuja la caja centrada con su largo en X; la rotamos a vertical y la
// subimos length/2 para que arranque en y=0 y el pivote quede en la junta.)
function ArmUp({ length }: { length: number }) {
  return (
    <group position={[0, length / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
      <Arm length={length} />
    </group>
  )
}

export function Lamp({ joints, ...props }: Props) {
  const j = { ...REST, ...joints }
  const neckTop = LAMP.base.height + LAMP.neck.height
  const lowerLen = LAMP.lowerArm.length
  const upperLen = LAMP.upperArm.length
  const pb = LAMP.pivotBlock

  return (
    <group {...props}>
      <Base />

      {/* SHOULDER: pivote en el tope del cuello */}
      <group position={[0, neckTop, 0]} rotation={[0, 0, j.shoulder]}>
        <ArmUp length={lowerLen} />
        {/* Resorte a lo largo del tramo bajo del brazo inferior, entre las barras */}
        <Spring position={[0, lowerLen * 0.2, 0]} />

        {/* ELBOW: pivote en el extremo superior del brazo inferior */}
        <group position={[0, lowerLen, 0]} rotation={[0, 0, j.elbow]}>
          <mesh castShadow>
            <boxGeometry args={[pb.x, pb.y, pb.z]} />
            <meshStandardMaterial color="#3a3a40" roughness={0.4} metalness={0.4} />
          </mesh>
          <ArmUp length={upperLen} />

          {/* HEAD: pivote en el extremo superior del brazo superior */}
          <group position={[0, upperLen, 0]} rotation={[0, 0, j.head]}>
            {/* eje del pivote (a lo largo de Z) */}
            <group rotation={[Math.PI / 2, 0, 0]}>
              <mesh castShadow>
                <cylinderGeometry
                  args={[LAMP.headPivot.diameter / 2, LAMP.headPivot.diameter / 2, 0.22, 20]}
                />
                <meshStandardMaterial color="#3a3a40" metalness={0.5} roughness={0.3} />
              </mesh>
            </group>
            {/* La cabeza: su boca (Ø grande) mira hacia -Y local. Sin rotación
                interna, con la pose de reposo la boca termina apuntando hacia
                abajo (ilumina el escritorio). Se afina con los sliders. */}
            <Head position={[0, 0, 0]} />
          </group>
        </group>
      </group>
    </group>
  )
}
