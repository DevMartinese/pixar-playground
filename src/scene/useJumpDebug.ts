/* eslint-disable react-hooks/refs -- ref de último-valor para el callback del botón (no se lee en render) */
import { useEffect, useRef, useState } from 'react'
import { useControls, button, monitor } from 'leva'
import { useFrame } from '@react-three/fiber'
import type { JumpChoreo, JumpTimeline, JumpState } from './jumpAnimation'
import { DEFAULT_CHOREO, createJumpState } from './jumpAnimation'
import type { LampPose } from '../luxoArmada/lampPose'
import { DEFAULT_LAMP_POSE } from '../luxoArmada/lampPose'
import type { LampLight } from '../luxoArmada/lampLight'
import { DEFAULT_LAMP_LIGHT } from '../luxoArmada/lampLight'

// Vuelca la config actual a consola + portapapeles, lista para pegar como
// DEFAULT_CHOREO en jumpAnimation.ts.
function copyChoreo(c: JumpChoreo) {
  const text = `export const DEFAULT_CHOREO: JumpChoreo = ${JSON.stringify(c, null, 2)}`
  console.log('[Salto] config actual:\n' + text)
  navigator.clipboard?.writeText(text).catch(() => {})
}

// Panel de debug en Leva para tunear TODA la coreografía del salto en vivo.
// `▶ repetir` reconstruye y reproduce con los valores actuales; `📋 copiar config`
// vuelca el objeto para hardcodearlo como default. Devuelve { choreo, replayKey }.
export function useJumpDebug(onReplay?: () => void): {
  choreo: JumpChoreo
  replayKey: number
  tlRef: { current: JumpTimeline | null }
  lampPose: LampPose
  bodyYaw: number
  stateRef: { current: JumpState }
  light: LampLight
} {
  const [replayKey, setReplayKey] = useState(0)
  const d = DEFAULT_CHOREO

  const pos = useControls('Salto · posición', {
    iLocalX: { value: d.iLocalX, min: 6, max: 16, step: 0.05, label: 'x de la I' },
    seatY: { value: d.seatY, min: -1, max: 1, step: 0.01, label: 'apoyo (hundir pie)' },
    iLocalZ: { value: d.iLocalZ, min: 0, max: 3, step: 0.05, label: 'z (trepar)' },
    overshoot: { value: d.overshoot, min: 0, max: 4, step: 0.05, label: 'overshoot' },
    lampScale: { value: d.lampScale, min: 0.5, max: 3, step: 0.05, label: 'escala lámpara' },
  })
  const looks = useControls('Salto · miradas', {
    lookIYaw: { value: d.lookIYaw, min: -3.14, max: 3.14, step: 0.01, label: 'yaw mira I' },
    endHeadPitch: { value: d.endHeadPitch, min: -3.14, max: 3.14, step: 0.01, label: 'pitch final cabeza' },
    lookIMs: { value: d.lookIMs, min: 50, max: 1500, step: 10, label: 'dur mira I' },
    lookCamMs: { value: d.lookCamMs, min: 50, max: 1500, step: 10, label: 'dur pitch final' },
    brakeMs: { value: d.brakeMs, min: 0, max: 1500, step: 10, label: 'frenado' },
    scanTilt: { value: d.scanTilt, min: 0, max: 1.5, step: 0.01, label: 'scaneo amplitud' },
    scanMs: { value: d.scanMs, min: 50, max: 800, step: 10, label: 'scaneo velocidad' },
    scanReps: { value: d.scanReps, min: 0, max: 5, step: 1, label: 'scaneo cabeceos' },
  })
  const onto = useControls('Salto · salto-encima', {
    jumpArc: { value: d.jumpArc, min: 0, max: 2, step: 0.05, label: 'altura arco' },
    anticipateMs: { value: d.anticipateMs, min: 50, max: 800, step: 10, label: 'anticipación' },
    ascendMs: { value: d.ascendMs, min: 80, max: 800, step: 10, label: 'ascenso' },
    fallMs: { value: d.fallMs, min: 80, max: 800, step: 10, label: 'caída (1er golpe)' },
    jumpYaw: { value: d.jumpYaw, min: -3.14, max: 3.14, step: 0.01, label: 'yaw al saltar' },
    jumpYawMs: { value: d.jumpYawMs, min: 100, max: 1500, step: 10, label: 'dur giro al saltar' },
    jumpLowerAngle: { value: d.jumpLowerAngle, min: -2, max: 2, step: 0.01, label: 'brazo inf al saltar' },
  })
  const bops = useControls('Salto · golpes', {
    deflate0: { value: d.deflate[0], min: 0.02, max: 1, step: 0.01, label: 'golpe 1 (jelly)' },
    deflate1: { value: d.deflate[1], min: 0.02, max: 1, step: 0.01, label: 'golpe 2 (jelly)' },
    deflate2: { value: d.deflate[2], min: 0.02, max: 1, step: 0.01, label: 'golpe 3 (jelly)' },
    deflate3: { value: d.deflate[3], min: 0.02, max: 1, step: 0.01, label: 'golpe 4 (jelly)' },
    deflate4: { value: d.deflate[4], min: 0.005, max: 1, step: 0.005, label: 'golpe 5 (aplasta)' },
    bopHopScale: { value: d.bopHopScale, min: 0, max: 3, step: 0.05, label: 'altura rebotes' },
    bopSpeedScale: { value: d.bopSpeedScale, min: 0.3, max: 3, step: 0.05, label: 'lentitud golpes' },
    widen: { value: d.widen, min: 0, max: 3, step: 0.05, label: 'ensanche I' },
  })

  const choreo: JumpChoreo = {
    iLocalX: pos.iLocalX,
    iTopY: DEFAULT_CHOREO.iTopY, // fallback (el tope real se mide del bbox de la I)
    seatY: pos.seatY,
    iLocalZ: pos.iLocalZ,
    overshoot: pos.overshoot,
    lampScale: pos.lampScale,
    lookIYaw: looks.lookIYaw,
    endHeadPitch: looks.endHeadPitch,
    scanTilt: looks.scanTilt,
    scanMs: looks.scanMs,
    scanReps: looks.scanReps,
    brakeMs: looks.brakeMs,
    lookIMs: looks.lookIMs,
    lookCamMs: looks.lookCamMs,
    jumpArc: onto.jumpArc,
    anticipateMs: onto.anticipateMs,
    ascendMs: onto.ascendMs,
    fallMs: onto.fallMs,
    jumpYaw: onto.jumpYaw,
    jumpYawMs: onto.jumpYawMs,
    jumpLowerAngle: onto.jumpLowerAngle,
    deflate: [bops.deflate0, bops.deflate1, bops.deflate2, bops.deflate3, bops.deflate4],
    bopHopScale: bops.bopHopScale,
    bopSpeedScale: bops.bopSpeedScale,
    widen: bops.widen,
  }
  const choreoRef = useRef(choreo)
  useEffect(() => {
    choreoRef.current = choreo
  })
  // Ref de último-valor para el callback del botón (evita closure stale en Leva).
  const onReplayRef = useRef(onReplay)
  useEffect(() => {
    onReplayRef.current = onReplay
  })

  // --- Pose de la lámpara (sólo aplica cuando el objeto que salta es la Luxo) ---
  // La animación de la mirada se SUMA a `headPitch` (no lo pisa), así estos
  // controles responden aunque haya salto.
  const lp = DEFAULT_LAMP_POSE
  const poseCtl = useControls('Lámpara · pose', {
    bodyYaw: { value: 0, min: -3.14, max: 3.14, step: 0.01, label: 'girar cuerpo (yaw)' },
    lowerAngle: { value: lp.lowerAngle, min: -2, max: 2, step: 0.01, label: 'brazo inferior' },
    elbowAngle: { value: lp.elbowAngle, min: -2.5, max: 2.5, step: 0.01, label: 'codo' },
    headTilt: { value: lp.headTilt, min: -2.5, max: 2.5, step: 0.01, label: 'inclinación cabeza (tilt)' },
    headPitch: { value: lp.headPitch, min: -3.14, max: 3.14, step: 0.01, label: 'cabeza arriba/abajo (pitch)' },
    headSpin: { value: lp.headSpin, min: -3.14, max: 3.14, step: 0.01, label: 'cabeza girar (spin)' },
  })
  const lampPose: LampPose = {
    lowerAngle: poseCtl.lowerAngle,
    elbowAngle: poseCtl.elbowAngle,
    headTilt: poseCtl.headTilt,
    headPitch: poseCtl.headPitch,
    headSpin: poseCtl.headSpin,
  }

  // --- Foco de la lámpara (spotLight que sale del bulbo) ---
  const dl = DEFAULT_LAMP_LIGHT
  const lightCtl = useControls('Lámpara · luz', {
    on: { value: dl.on, label: 'encendido' },
    intensity: { value: dl.intensity, min: 0, max: 120, step: 1, label: 'intensidad' },
    angle: { value: dl.angle, min: 0.05, max: 1.4, step: 0.01, label: 'ángulo cono' },
    penumbra: { value: dl.penumbra, min: 0, max: 1, step: 0.01, label: 'penumbra' },
    distance: { value: dl.distance, min: 1, max: 50, step: 1, label: 'alcance' },
    decay: { value: dl.decay, min: 0, max: 3, step: 0.1, label: 'atenuación' },
    color: { value: dl.color, label: 'color' },
    castShadow: { value: dl.castShadow, label: 'sombras' },
    volumetric: { value: dl.volumetric, label: 'rayos (volumétrico)' },
    coneOpacity: { value: dl.coneOpacity, min: 0, max: 1, step: 0.01, label: 'opacidad rayos' },
    coneAttenuation: { value: dl.coneAttenuation, min: 1, max: 40, step: 1, label: 'largo rayos' },
    anglePower: { value: dl.anglePower, min: 0, max: 12, step: 0.5, label: 'borde rayos' },
    halo: { value: dl.halo, label: 'halo bulbo' },
    haloSize: { value: dl.haloSize, min: 0, max: 3, step: 0.05, label: 'tamaño halo' },
    haloOpacity: { value: dl.haloOpacity, min: 0, max: 2, step: 0.05, label: 'brillo halo' },
  })
  const light: LampLight = {
    on: lightCtl.on,
    intensity: lightCtl.intensity,
    angle: lightCtl.angle,
    penumbra: lightCtl.penumbra,
    distance: lightCtl.distance,
    decay: lightCtl.decay,
    color: lightCtl.color,
    castShadow: lightCtl.castShadow,
    volumetric: lightCtl.volumetric,
    coneAttenuation: lightCtl.coneAttenuation,
    anglePower: lightCtl.anglePower,
    coneOpacity: lightCtl.coneOpacity,
    halo: lightCtl.halo,
    haloSize: lightCtl.haloSize,
    haloOpacity: lightCtl.haloOpacity,
  }

  // --- Estado en vivo: telemetría de los valores animados (lo que cambia frame a
  // frame). El jumper activo escribe en este mismo objeto; los monitores de Leva
  // lo muestran en tiempo real mientras reproduce o scrubea. ---
  const stateRef = useRef<JumpState>(createJumpState())
  // graph: false → muestra el NÚMERO en vivo (no la sparkline de frecuencia).
  const mon = (sel: (s: JumpState) => number) =>
    monitor(() => sel(stateRef.current), { graph: false, interval: 30 })
  useControls('Estado en vivo', {
    x: mon((s) => s.x),
    y: mon((s) => s.y),
    z: mon((s) => s.z),
    bodyYaw: mon((s) => s.bodyYaw),
    headTilt: mon((s) => s.headTilt),
    headPitch: mon((s) => s.headPitch),
    scaleY: mon((s) => s.scaleY),
    scaleXZ: mon((s) => s.scaleXZ),
    bend: mon((s) => s.bend),
    'I scaleY': mon((s) => s.iScaleY),
  })

  // --- Timeline editor: reproducir / pausar + scrub (seek a cualquier momento) ---
  const tlRef = useRef<JumpTimeline | null>(null)
  const { reproducir, tiempo, loop, loopDelay } = useControls('Salto · timeline', {
    reproducir: { value: true, label: '▶ reproducir' },
    tiempo: { value: 0, min: 0, max: 1, step: 0.001, label: 'scrub (0–1)' },
    loop: { value: false, label: '🔁 loop' },
    loopDelay: { value: 2, min: 0, max: 10, step: 0.5, label: 'espera loop (s)' },
  })
  const applied = useRef<boolean | null>(null)
  const loopTimer = useRef<number | null>(null)
  const clearLoopTimer = () => {
    if (loopTimer.current != null) {
      clearTimeout(loopTimer.current)
      loopTimer.current = null
    }
  }
  // Al reconstruir (repetir/loop) se re-aplica play/pausa y se limpia el timer.
  useEffect(() => {
    applied.current = null
    clearLoopTimer()
  }, [replayKey])
  // Si se apaga el loop, cancela cualquier reinicio pendiente.
  useEffect(() => {
    if (!loop) clearLoopTimer()
    return clearLoopTimer
  }, [loop])
  useFrame(() => {
    const tl = tlRef.current
    if (!tl) return
    if (applied.current !== reproducir) {
      if (reproducir) tl.play()
      else tl.pause()
      applied.current = reproducir
    }
    // Pausado: el slider scrubea a tiempo·duración (cabecita de reproducción).
    if (!reproducir) tl.seek(tiempo * (tl.duration || 0))
    // Loop: si está reproduciendo y la secuencia llegó al final, reprograma el
    // reinicio tras `loopDelay` segundos (vuelve a empezar todo el cruce + salto).
    else if (loop && loopTimer.current == null && tl.duration && tl.currentTime >= tl.duration) {
      loopTimer.current = window.setTimeout(() => {
        loopTimer.current = null
        setReplayKey((k) => k + 1)
      }, loopDelay * 1000)
    }
  })

  useControls('Salto · acciones', {
    '▶ repetir': button(() => {
      onReplayRef.current?.() // colapsa el panel para ver la animación limpia
      setReplayKey((k) => k + 1)
    }),
    '📋 copiar config': button(() => copyChoreo(choreoRef.current)),
  })

  return { choreo, replayKey, tlRef, lampPose, bodyYaw: poseCtl.bodyYaw, stateRef, light }
}
