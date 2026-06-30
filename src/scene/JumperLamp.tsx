import { useEffect, useRef } from 'react'
import type { Group, Object3D } from 'three'
import { useFrame } from '@react-three/fiber'
import type { ThreeElements } from '@react-three/fiber'
import { buildJumpTimeline, buildJumpOntoI, createJumpState, DEFAULT_CHOREO } from './jumpAnimation'
import type { JumpChoreo, JumpTimeline, JumpState } from './jumpAnimation'
import { LuxoLampModel } from '../luxoArmada/LuxoLampModel'
import type { LampLight } from '../luxoArmada/lampLight'
import type { LampPose } from '../luxoArmada/lampPose'
import { DEFAULT_LAMP_POSE } from '../luxoArmada/lampPose'

// La Luxo ensamblada saltando, cruzando la escena PIXAR y aplastando la I (misma
// animación que el cilindro + las miradas). `choreo`: params (panel debug);
// `replayKey`: cambia → reconstruye y repite; `tlRef`: recibe el timeline para
// scrubear/pausar desde el panel.
type JumperLampProps = ThreeElements['group'] & {
  getI?: () => Object3D | null
  choreo?: JumpChoreo
  replayKey?: number
  tlRef?: { current: JumpTimeline | null }
  pose?: LampPose
  bodyYaw?: number
  stateRef?: { current: JumpState }
  light?: Partial<LampLight>
}
export function JumperLamp({
  getI,
  choreo = DEFAULT_CHOREO,
  replayKey = 0,
  tlRef,
  pose = DEFAULT_LAMP_POSE,
  bodyYaw = 0,
  stateRef: externalStateRef,
  light,
  ...props
}: JumperLampProps) {
  const animRef = useRef<Group>(null)
  const headRef = useRef<Group>(null)
  const tiltRef = useRef<Group>(null)
  const lowerRef = useRef<Group>(null)
  const iMeshRef = useRef<Object3D | null>(null)
  const localStateRef = useRef(createJumpState())
  const stateRef = externalStateRef ?? localStateRef

  useEffect(() => {
    Object.assign(stateRef.current, createJumpState()) // reset al repetir
    const iMesh = getI?.() ?? null
    iMeshRef.current = iMesh
    const tl = iMesh
      ? buildJumpOntoI(stateRef.current, iMesh, { lookBeats: true }, choreo)
      : buildJumpTimeline(stateRef.current)
    if (tlRef) tlRef.current = tl
    return () => {
      tl.revert()
      if (tlRef) tlRef.current = null
      if (iMesh) iMesh.scale.set(1, 1, 1) // restaura la I al desmontar/repetir
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replayKey])

  useFrame(() => {
    const g = animRef.current
    if (!g) return
    const s = stateRef.current
    const scale = choreo.lampScale // useFrame re-suscribe con el choreo actual
    g.position.x = s.x
    g.position.y = s.y
    g.position.z = s.z
    // La "mirada": gira el CUERPO entero. Pose base (slider) + animación del salto.
    g.rotation.y = bodyYaw + s.bodyYaw
    // Escala base de la lámpara × squash/stretch del salto.
    g.scale.set(scale * s.scaleXZ, scale * s.scaleY, scale * s.scaleXZ)
    // Cabeza: el pitch suma la pose base + el offset animado (inclinación final);
    // el spin queda fijo según la pose del panel.
    if (headRef.current) {
      headRef.current.rotation.x = pose.headPitch + s.headPitch
      headRef.current.rotation.y = pose.headSpin
    }
    // El cuello (tilt) cabecea el "scaneo": pose base + offset animado del salto.
    if (tiltRef.current) tiltRef.current.rotation.z = pose.headTilt + s.headTilt
    // El brazo inferior interpola de la pose base al ángulo de salto (lowerBlend).
    if (lowerRef.current) {
      const t = s.lowerBlend
      lowerRef.current.rotation.z = pose.lowerAngle * (1 - t) + choreo.jumpLowerAngle * t
    }
    // La "I" se aplasta por frame (state-driven), así sigue el scrub/seek.
    if (iMeshRef.current) iMeshRef.current.scale.set(s.iScaleXZ, s.iScaleY, s.iScaleXZ)
  })

  return (
    <group {...props}>
      <group ref={animRef}>
        <LuxoLampModel pose={pose} headRef={headRef} tiltRef={tiltRef} lowerRef={lowerRef} light={light} />
      </group>
    </group>
  )
}
