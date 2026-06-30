import { useEffect, useRef } from 'react'
import { Vector3, Quaternion } from 'three'
import type { Group, Object3D, Mesh, MeshBasicMaterial } from 'three'
import { useFrame } from '@react-three/fiber'
import type { ThreeElements } from '@react-three/fiber'
import { buildJumpTimeline, buildJumpOntoI, createJumpState, DEFAULT_CHOREO } from './jumpAnimationFixed'
import type { JumpChoreo, JumpTimeline, JumpState, CrossMode } from './jumpAnimationFixed'
import { LuxoLampModel } from '../luxoArmada/LuxoLampModel'
import { DEFAULT_LAMP_LIGHT } from '../luxoArmada/lampLight'
import type { LampLight } from '../luxoArmada/lampLight'
import type { LampPose } from '../luxoArmada/lampPose'
import { DEFAULT_LAMP_POSE } from '../luxoArmada/lampPose'

// El bulbo está ~0.55 (en unidades base de la lámpara) por encima del pivote de la
// cabeza (headRef), a lo largo del eje +y local de la cabeza (por donde mira el foco).
const BULB_OFFSET = 0.55
const FLOOR_Y = 0.012 // el charco se apoya un pelín por encima del piso/sombra

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
  floorPoolRef?: { current: Mesh | null } // charco de luz en el piso (vive en la escena)
  crossMode?: CrossMode
}
export function JumperLampFixed({
  getI,
  choreo = DEFAULT_CHOREO,
  replayKey = 0,
  tlRef,
  pose = DEFAULT_LAMP_POSE,
  bodyYaw = 0,
  stateRef: externalStateRef,
  light,
  floorPoolRef,
  crossMode = 'actual',
  ...props
}: JumperLampProps) {
  const animRef = useRef<Group>(null)
  const headRef = useRef<Group>(null)
  const tiltRef = useRef<Group>(null)
  const lowerRef = useRef<Group>(null)
  const iMeshRef = useRef<Object3D | null>(null)
  const localStateRef = useRef(createJumpState())
  const stateRef = externalStateRef ?? localStateRef
  // Temporales reutilizados por frame (sin asignar en el bucle de render).
  const tmp = useRef({ origin: new Vector3(), aim: new Vector3(), quat: new Quaternion() })

  useEffect(() => {
    Object.assign(stateRef.current, createJumpState()) // reset al repetir
    const iMesh = getI?.() ?? null
    iMeshRef.current = iMesh
    const tl = iMesh
      ? buildJumpOntoI(stateRef.current, iMesh, { lookBeats: true, crossMode }, choreo)
      : buildJumpTimeline(stateRef.current)
    if (tlRef) tlRef.current = tl
    return () => {
      tl.revert()
      if (tlRef) tlRef.current = null
      if (iMesh) iMesh.scale.set(1, 1, 1) // restaura la I al desmontar/repetir
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replayKey, crossMode])

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

    // --- Charco de luz en el piso ---
    // Proyecta dónde el eje del foco (eje +y de la cabeza) corta el plano y=0 y
    // posiciona ahí un resplandor aditivo, escalado a la huella del cono y atenuado
    // por la verticalidad (mira recto abajo → fuerte; rasante → se apaga).
    const pool = floorPoolRef?.current
    if (pool) {
      const L = { ...DEFAULT_LAMP_LIGHT, ...light }
      const head = headRef.current
      const t = tmp.current
      let op = 0
      if (L.on && L.floorPool && head) {
        head.getWorldQuaternion(t.quat)
        t.aim.set(0, 1, 0).applyQuaternion(t.quat).normalize() // hacia dónde apunta el foco
        head.getWorldPosition(t.origin)
        // del pivote de la cabeza al bulbo, a lo largo del eje del foco (escala incluida).
        t.origin.addScaledVector(t.aim, BULB_OFFSET * choreo.lampScale * s.scaleY)
        const down = -t.aim.y // 0 = rasante, 1 = recto hacia abajo
        if (down > 0.001 && t.origin.y > 0) {
          const dist = t.origin.y / down // distancia hasta el piso por el eje del foco
          const hx = t.origin.x + t.aim.x * dist
          const hz = t.origin.z + t.aim.z * dist
          const radius = dist * Math.tan(L.angle) * L.floorPoolSize
          pool.position.set(hx, FLOOR_Y, hz)
          const d = Math.min(radius * 2, 60) // diámetro (cap por si raspa el piso)
          pool.scale.set(d, d, 1)
          op = down * down * L.floorPoolOpacity // ^2 → aparece al enderezar la mirada
        }
      }
      /* eslint-disable react-hooks/immutability -- el mesh del charco vive en la escena;
         la lámpara lo dibuja imperativamente por frame (no es estado de React). */
      const mat = pool.material as MeshBasicMaterial
      mat.opacity = op
      mat.color.set(L.color)
      pool.visible = op > 0.001
      /* eslint-enable react-hooks/immutability */
    }
  })

  return (
    <group {...props}>
      <group ref={animRef}>
        <LuxoLampModel pose={pose} headRef={headRef} tiltRef={tiltRef} lowerRef={lowerRef} light={light} />
      </group>
    </group>
  )
}
