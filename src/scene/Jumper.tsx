import { useEffect, useMemo, useRef } from 'react'
import type { Group, Object3D } from 'three'
import { CylinderGeometry } from 'three'
import { useFrame } from '@react-three/fiber'
import type { ThreeElements } from '@react-three/fiber'
import { buildJumpTimeline, buildJumpOntoI, createJumpState } from './jumpAnimation'
import type { JumpChoreo, JumpTimeline, JumpState } from './jumpAnimation'

const HEIGHT = 2.0 // alto del cilindro (a la altura de las letras, que miden 2)
const RADIUS = 0.5
const H_SEGMENTS = 24 // suficientes anillos para que el doblado se vea suave

// Encorva la geometría del cilindro hacia adelante (+x local) un ángulo `bend`
// (radianes), pivotando sobre la base: la base queda recta y plantada y el
// cuerpo se curva como un resorte. Reescribe las posiciones desde la copia en
// reposo `base` (el cilindro está centrado en el origen: y ∈ [-H/2, +H/2]).
function applyBend(geo: CylinderGeometry, base: Float32Array, height: number, bend: number) {
  const pos = geo.attributes.position
  const arr = pos.array as Float32Array
  if (Math.abs(bend) < 1e-5) {
    arr.set(base) // recto: restaura la geometría en reposo
  } else {
    const k = bend / height // curvatura
    const R = 1 / k // radio del arco
    for (let i = 0; i < arr.length; i += 3) {
      const x0 = base[i]
      const y0 = base[i + 1]
      const z0 = base[i + 2]
      const h = y0 + height / 2 // altura desde la base (0..H)
      const a = k * h // ángulo acumulado a esta altura
      const ca = Math.cos(a)
      const sa = Math.sin(a)
      arr[i] = R * (1 - ca) + x0 * ca
      arr[i + 1] = (R - x0) * sa - height / 2
      arr[i + 2] = z0
    }
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()
}

// Cilindro que salta (estilo Luxo) cruzando la escena. La timeline anima un
// estado de números (createJumpState); aquí lo aplicamos cada frame al grupo
// (posición/escala, con la base apoyada en y=0) y a la deformación real de la
// geometría (encorvado). `props` posiciona/orienta el grupo exterior estático.
// `getI`: malla de la "I" (si está → cruza, salta encima y la aplasta). `choreo`:
// params de la coreografía (panel debug). `replayKey`: cambia → reconstruye y repite.
type JumperProps = ThreeElements['group'] & {
  getI?: () => Object3D | null
  choreo?: JumpChoreo
  replayKey?: number
  tlRef?: { current: JumpTimeline | null }
  stateRef?: { current: JumpState }
}
export function Jumper({ getI, choreo, replayKey = 0, tlRef, stateRef: externalStateRef, ...props }: JumperProps) {
  const animRef = useRef<Group>(null)
  const iMeshRef = useRef<Object3D | null>(null)
  const localStateRef = useRef(createJumpState())
  const stateRef = externalStateRef ?? localStateRef
  const lastBend = useRef(Number.NaN)

  const geo = useMemo(
    () => new CylinderGeometry(RADIUS, RADIUS, HEIGHT, 32, H_SEGMENTS),
    [],
  )
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array), [geo])

  useEffect(() => {
    Object.assign(stateRef.current, createJumpState()) // reset al repetir
    const iMesh = getI?.() ?? null
    iMeshRef.current = iMesh
    const tl = iMesh
      ? buildJumpOntoI(stateRef.current, iMesh, {}, choreo)
      : buildJumpTimeline(stateRef.current)
    if (tlRef) tlRef.current = tl
    return () => {
      tl.revert()
      if (tlRef) tlRef.current = null
      if (iMesh) iMesh.scale.set(1, 1, 1) // restaura la I al desmontar/repetir
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replayKey])

  useEffect(() => () => geo.dispose(), [geo])

  useFrame(() => {
    const g = animRef.current
    if (!g) return
    const s = stateRef.current
    g.position.x = s.x
    g.position.y = s.y
    g.position.z = s.z
    g.scale.set(s.scaleXZ, s.scaleY, s.scaleXZ)
    // Sólo rehace la geometría cuando el encorvado cambió (evita recomputar
    // normales en los tramos en que el cuerpo va recto).
    if (s.bend !== lastBend.current) {
      applyBend(geo, base, HEIGHT, s.bend)
      lastBend.current = s.bend
    }
    // La "I" se aplasta por frame (state-driven), así sigue el scrub/seek.
    if (iMeshRef.current) iMeshRef.current.scale.set(s.iScaleXZ, s.iScaleY, s.iScaleXZ)
  })

  return (
    <group {...props}>
      <group ref={animRef}>
        <mesh position={[0, HEIGHT / 2, 0]} geometry={geo} castShadow>
          <meshStandardMaterial color="#e53935" roughness={0.4} metalness={0.1} />
        </mesh>
      </group>
    </group>
  )
}
