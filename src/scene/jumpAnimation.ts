import { createTimeline } from 'animejs'
import type { Mesh, Object3D } from 'three'
// Adapter three: para animar la escala de la malla de la "I" en el mismo timeline.
import './animeAdapter'

// Salto con gravedad real: sube DESACELERANDO (outQuad → pierde velocidad) y cae
// ACELERANDO (inQuad). Asentamiento elástico (estilo "i squish") para la I.
const JIGGLE = 'outElastic(1.6, 0.5)'
const JIGGLE_SOFT = 'outElastic(2.11, 0.61)'

// Timeline de anime.js (para scrubear/seek desde el panel debug).
export type JumpTimeline = ReturnType<typeof createTimeline>

// Estado del salto: números planos que la timeline de anime.js anima. El
// componente los lee cada frame y los aplica al grupo (posición/escala) y a la
// deformación de la geometría (bend). No usa el adapter three: animamos un
// objeto JS común, así el `bend` (que no es una transform) viaja por el mismo
// timeline, sincronizado con el resto del salto.
export type JumpState = {
  x: number
  y: number
  z: number // avance hacia el plano del texto (para treparse a la I)
  bodyYaw: number // giro del CUERPO entero (yaw) — la "mirada": sólo la lámpara lo usa
  lowerBlend: number // 0..1: interpola el brazo inferior de la pose base al ángulo de salto
  headTilt: number // OFFSET del tilt del cuello — el "scaneo" de la I (sólo lámpara)
  headPitch: number // OFFSET del pitch de la cabeza — sólo se anima al final (sólo lámpara)
  headSpin: number // giro del cuello — NUNCA se anima (sólo pose estática)
  scaleXZ: number
  scaleY: number
  bend: number // ángulo de encorvado hacia adelante, en radianes (0 = recto)
  // Squash de la "I" (1 = entera). State-driven y aplicado por frame en el
  // componente, así sigue el scrub/seek igual que el resto (NO usa el adapter
  // three, que sólo escribe la malla al reproducir, no al hacer seek).
  iScaleY: number
  iScaleXZ: number
}

export type JumpParams = {
  hopHeight: number // altura de la cima del arco (y)
  hopStep: number // avance en x por salto
  hops: number // saltos antes de reiniciar el bucle
  squashY: number // escala Y al aplastar (<1)
  stretchY: number // escala Y al estirar (>1)
  squashXZ: number // escala X/Z al aplastar (>1)
  stretchXZ: number // escala X/Z al estirar (<1)
  bendDeg: number // encorvado máximo hacia adelante en el agache (grados)
  flightBendDeg: number // encorvado residual durante el ascenso (grados)
  anticipateMs: number // agacharse y encorvarse para tomar impulso
  holdMs: number // mantiene el agache un instante (lee la intención de saltar)
  ascendMs: number // empuje + estirón hacia la cima
  hangMs: number // flota un momento en la cima (hang time)
  fallMs: number // caída acelerada al suelo
  landMs: number // aterrizaje; se reparte 20% impacto / 80% recuperación elástica
}

export const DEFAULT_JUMP: JumpParams = {
  hopHeight: 1.7,
  hopStep: 1.9, // 8 saltos × 1.9 ≈ 15.2 ≈ ancho del texto "PIXAR"
  hops: 8,
  squashY: 0.55,
  stretchY: 1.35,
  squashXZ: 1.4,
  stretchXZ: 0.86, // ~conserva volumen con stretchY=1.35 (0.86²·1.35≈1.0)
  bendDeg: 30, // encorvado marcado hacia adelante en el agache
  flightBendDeg: 6, // leve curva hacia adelante mientras sube
  anticipateMs: 240,
  holdMs: 90,
  ascendMs: 320,
  hangMs: 120,
  fallMs: 280,
  landMs: 440,
}

const DEG = Math.PI / 180

export function createJumpState(): JumpState {
  return { x: 0, y: 0, z: 0, bodyYaw: 0, lowerBlend: 0, headTilt: 0, headPitch: 0, headSpin: 0, scaleXZ: 1, scaleY: 1, bend: 0, iScaleY: 1, iScaleXZ: 1 }
}

// Construye un timeline en bucle que hace saltar `state` hacia adelante con
// sensación orgánica (principios de animación clásica): anticipación (se agacha
// y se ENCORVA hacia adelante), estirón al despegar, flotación en la cima,
// impacto y rebote elástico al aterrizar. El encorvado (`bend`) se traduce en
// una deformación real de la geometría en el componente.
export function buildJumpTimeline(state: JumpState, params: JumpParams = DEFAULT_JUMP) {
  // anime: loop: true rebobina las propiedades a sus valores iniciales
  // (x=0, y=0, escala neutra, bend=0) antes de repetir, así el cruce reinicia
  // desde el comienzo sin saltos bruscos.
  const tl = createTimeline({ loop: true })
  const bendMax = params.bendDeg * DEG
  const bendFlight = params.flightBendDeg * DEG
  for (let i = 0; i < params.hops; i++) {
    const x0 = i * params.hopStep
    const xMid = x0 + params.hopStep / 2
    const x1 = x0 + params.hopStep
    tl
      // 1. anticipación: se agacha y se ENCORVA hacia adelante (hacia donde va a
      //    saltar), comprimiéndose para tomar impulso. Desacelera al asentarse.
      .add(state, {
        scaleY: params.squashY,
        scaleXZ: params.squashXZ,
        bend: bendMax,
        ease: 'outQuad',
        duration: params.anticipateMs,
      })
      // 2. hold: mantiene el agache encorvado un instante.
      .add(state, {
        scaleY: params.squashY,
        ease: 'linear',
        duration: params.holdMs,
      })
      // 3. despegue + ascenso: empuje explosivo, estirón, se endereza (libera el
      //    resorte) dejando una leve curva, y avanza medio paso hasta la cima.
      .add(state, {
        y: params.hopHeight,
        x: xMid,
        scaleY: params.stretchY,
        scaleXZ: params.stretchXZ,
        bend: bendFlight,
        ease: 'outQuad',
        duration: params.ascendMs,
      })
      // 4. hang: flota en la cima, escala neutra y cuerpo recto.
      .add(state, {
        scaleY: 1,
        scaleXZ: 1,
        bend: 0,
        ease: 'inOutSine',
        duration: params.hangMs,
      })
      // 5. caída: baja acelerando y completa el paso.
      .add(state, {
        y: 0,
        x: x1,
        ease: 'inQuad',
        duration: params.fallMs,
      })
      // 6. impacto: squash fuerte al tocar el suelo, cuerpo recto.
      .add(state, {
        scaleY: params.squashY,
        scaleXZ: params.squashXZ,
        bend: 0,
        ease: 'outQuad',
        duration: params.landMs * 0.2,
      })
      // 7. recuperación: rebote elástico (overshoot) de vuelta a neutro.
      .add(state, {
        scaleY: 1,
        scaleXZ: 1,
        ease: 'outElastic',
        duration: params.landMs * 0.8,
      })
  }
  return tl
}

// Alturas/duraciones BASE de los rebotes entre golpes (se escalan por choreo.*).
// El [0] no se usa (el 1er golpe es la caída del salto-encima). Saltos ALTOS y
// con arco LARGO (no saltitos cortos ni pausa arriba): el arco dura más que el
// jelly de la I → orgánico, sin frenarse en la cima.
// Arco estilo LUXO (gravedad real): saltos ALTOS, la SUBIDA desacelera (outQuad,
// "pelea la gravedad") y la CAÍDA acelera (inQuad, "se desploma"); la caída dura
// un poco MÁS que la subida → pesa. El squash&stretch (abajo) vende el peso.
const BASE_BOP_HOP = [0, 3.0, 2.7, 2.4, 2.1]
const BASE_BOP_UP_MS = [0, 360, 340, 320, 300]
const BASE_BOP_DOWN_MS = [320, 440, 420, 400, 380]
const HOPS_CROSS = 7 // saltos del cruce (hasta pasar la I)

// Parámetros de la coreografía "saltar sobre la I" — TODO tuneable en vivo (Leva).
// Coords LOCALES del saltarín (grupo exterior en world x≈7.55, z≈1.8, rotado 180°
// en Y → world x = 7.55 − localx, world z = 1.8 − localz).
export type JumpChoreo = {
  iLocalX: number // x local donde está la I (worldX≈−3.885)
  iTopY: number // FALLBACK del tope de la I si no se puede medir del bbox de la malla
  seatY: number // offset fino de apoyo: <0 hunde el pie en la I (cierra cualquier hueco)
  iLocalZ: number // z local para caer sobre el plano del texto
  overshoot: number // cuánto PASA la I antes de frenar (sólo lámpara)
  lampScale: number // escala de la lámpara en la escena
  lookIYaw: number // giro del CUERPO (yaw) para mirar la I tras pasarla
  endHeadPitch: number // inclinación final de la cabeza (pitch) al terminar de aplastar
  scanTilt: number // amplitud del "scaneo" del cuello (tilt) sobre la I, antes de saltar
  scanMs: number // duración de cada medio-cabeceo del scaneo
  scanReps: number // cuántos cabeceos hace el scaneo
  jumpYaw: number // bodyYaw al que SIGUE girando al saltar sobre la I (mín total -3.14)
  jumpYawMs: number // duración (lenta/fluida) de ese giro, en paralelo al ascenso
  jumpLowerAngle: number // ángulo ABSOLUTO del brazo inferior al saltar sobre la I
  brakeMs: number // hold del frenado
  lookIMs: number // duración de la mirada a la I
  lookCamMs: number // duración de la mirada a la cámara
  jumpArc: number // altura extra del arco al saltar sobre la I
  anticipateMs: number // anticipación del salto-encima
  ascendMs: number // ascenso del salto-encima
  fallMs: number // caída del salto-encima (1er golpe)
  deflate: [number, number, number, number, number] // scaleY de la I en cada golpe
  bopHopScale: number // multiplica las alturas de rebote
  bopSpeedScale: number // multiplica las duraciones de los golpes (mayor = más lento)
  widen: number // cuánto se ensancha la I al aplastarse (X/Z)
}

export const DEFAULT_CHOREO: JumpChoreo = {
  iLocalX: 11.44,
  iTopY: 2.0,
  seatY: 0,
  iLocalZ: 1.8,
  overshoot: 1.7,
  lampScale: 1.6,
  lookIYaw: -2.0,
  endHeadPitch: 1.5,
  scanTilt: 0.5,
  scanMs: 220,
  scanReps: 2,
  jumpYaw: -3.14,
  jumpYawMs: 650,
  jumpLowerAngle: 0.35,
  brakeMs: 260,
  lookIMs: 380,
  lookCamMs: 600,
  jumpArc: 0.4, // arco más bajo sobre la I → menos "flote" en el apex
  anticipateMs: 240,
  ascendMs: 260, // ascenso más rápido → el apex pasa rápido, cae de una
  fallMs: 260,
  // Golpes 1-4: compresión SUAVE (la I resiste, jelly, vuelve a su forma).
  // Golpe 5: aplasta a ras del piso (no se recupera).
  deflate: [0.8, 0.78, 0.76, 0.74, 0.02],
  bopHopScale: 1,
  bopSpeedScale: 1,
  widen: 0, // la I se aplasta SOLO en altura (Y), sin ensancharse en X/Z
}

// Ensanche X/Z de la I en función de su scaleY (conserva ~volumen al aplastarse).
function iWiden(scaleY: number, widen: number): number {
  return 1 + (1 - scaleY) * widen
}

// Un solo salto (anticipación → estirón → hang → caída → impacto → rebote),
// avanzando `step` en x desde x0.
function addHop(
  tl: ReturnType<typeof createTimeline>,
  state: JumpState,
  params: JumpParams,
  x0: number,
  step: number,
) {
  const bendMax = params.bendDeg * DEG
  const bendFlight = params.flightBendDeg * DEG
  tl
    .add(state, { scaleY: params.squashY, scaleXZ: params.squashXZ, bend: bendMax, ease: 'outQuad', duration: params.anticipateMs })
    .add(state, { scaleY: params.squashY, ease: 'linear', duration: params.holdMs })
    .add(state, { y: params.hopHeight, x: x0 + step / 2, scaleY: params.stretchY, scaleXZ: params.stretchXZ, bend: bendFlight, ease: 'outQuad', duration: params.ascendMs })
    .add(state, { scaleY: 1, scaleXZ: 1, bend: 0, ease: 'inOutSine', duration: params.hangMs })
    .add(state, { y: 0, x: x0 + step, ease: 'inQuad', duration: params.fallMs })
    .add(state, { scaleY: params.squashY, scaleXZ: params.squashXZ, bend: 0, ease: 'outQuad', duration: params.landMs * 0.2 })
    .add(state, { scaleY: 1, scaleXZ: 1, ease: 'outElastic', duration: params.landMs * 0.8 })
}

// Coreografía: cruza saltando y salta ENCIMA de la "I" aplastándola. Con
// `lookBeats` (lámpara) suma las "miradas" (mira la I antes de saltar y mira a la
// cámara al final); sin él (cilindro) es sólo cruzar → saltar encima → aplastar.
// El saltarín baja CON la I y ambos rebotan en sincronía (adapter three, '<').
export function buildJumpOntoI(
  state: JumpState,
  iMesh: Object3D,
  opts: { lookBeats?: boolean } = {},
  c: JumpChoreo = DEFAULT_CHOREO,
  params: JumpParams = DEFAULT_JUMP,
) {
  const lookBeats = opts.lookBeats ?? false
  // One-shot (no loop): la I queda APLASTADA al final.
  const tl = createTimeline({ loop: false })
  const D = c.deflate
  const w = (sy: number) => iWiden(sy, c.widen)
  // Tope REAL de la I: alto del glyph, medido del bbox de la malla (el default 2.0
  // sobreestimaba — la "I" mide ~1.4 —, por eso el pie quedaba flotando). El pie
  // del saltarín (y=0 local) sigue `top·deflate`, que ES el tope de la I escalada,
  // así no queda hueco. `seat` (<0) hunde un poco más para un apoyo prolijo.
  const geo = (iMesh as Mesh).geometry
  if (geo && !geo.boundingBox) geo.computeBoundingBox()
  const top = geo?.boundingBox ? geo.boundingBox.max.y : c.iTopY
  const seat = c.seatY
  const xPast = c.iLocalX + (lookBeats ? c.overshoot : 0.4)
  const step = xPast / HOPS_CROSS

  // 1. Cruce.
  for (let i = 0; i < HOPS_CROSS; i++) addHop(tl, state, params, i * step, step)

  // 2. Frena.
  tl.add(state, { y: 0, ease: 'linear', duration: c.brakeMs })

  // 3. (lámpara) Mira la I girando el CUERPO entero (bodyYaw), fluido. La cabeza
  //    (pitch/spin) NO se anima nunca.
  if (lookBeats) {
    tl.add(state, { bodyYaw: c.lookIYaw, ease: 'inOutSine', duration: c.lookIMs })
      .add(state, { bodyYaw: c.lookIYaw, ease: 'linear', duration: 200 })

    // 3b. Scaneo: ya girado hacia la I, cabecea el cuello (headTilt) sobre ella
    //     un par de veces, como examinándola, y vuelve a neutro antes de saltar.
    for (let i = 0; i < c.scanReps; i++) {
      tl.add(state, { headTilt: c.scanTilt, ease: 'inOutSine', duration: c.scanMs })
        .add(state, { headTilt: -c.scanTilt * 0.6, ease: 'inOutSine', duration: c.scanMs })
    }
    tl.add(state, { headTilt: 0, ease: 'inOutSine', duration: c.scanMs })
  }

  // 4. Salta ENCIMA de la I: anticipación → arco (sube, vuelve en x, entra en z
  //    sobre el texto) → cae sobre el tope de la I.
  //    (lámpara) Al ARRANCAR el salto, SIGUE girando el cuerpo (lookIYaw → jumpYaw,
  //    el mínimo total) en paralelo ('<'), lento y fluido, abarcando el ascenso.
  if (lookBeats) {
    // En paralelo: sigue girando el cuerpo Y lleva el brazo inferior al ángulo de salto.
    tl.add(state, { bodyYaw: c.jumpYaw, lowerBlend: 1, ease: 'inOutSine', duration: c.jumpYawMs })
    tl.add(state, { scaleY: params.squashY, scaleXZ: params.squashXZ, ease: 'outQuad', duration: c.anticipateMs }, '<')
  } else {
    tl.add(state, { scaleY: params.squashY, scaleXZ: params.squashXZ, ease: 'outQuad', duration: c.anticipateMs })
  }
  tl
    // SUBE en arco hacia la I (sin hold previo → sin pausa). Estira al despegar.
    .add(state, {
      y: top + c.jumpArc + seat,
      x: (xPast + c.iLocalX) / 2,
      z: c.iLocalZ / 2,
      scaleY: params.stretchY,
      scaleXZ: params.stretchXZ,
      ease: 'outQuad',
      duration: c.ascendMs,
    })
    // 4b. Caída = PRIMER golpe: cae sobre la I y la hunde a deflate[0]. La I
    //     (iScaleY/iScaleXZ) baja EN EL MISMO tween → perfectamente sincronizada.
    .add(state, {
      y: top * D[0] + seat,
      x: c.iLocalX,
      z: c.iLocalZ,
      scaleY: 0.92,
      scaleXZ: 1.05,
      iScaleY: D[0],
      iScaleXZ: w(D[0]),
      ease: 'inQuad',
      duration: c.fallMs,
    })

  // 5. Golpes 2..5: cada uno REBOTA (el saltarín sube y la I vuelve a su forma con
  //    un overshoot jelly) y luego PRESIONA de nuevo. Los primeros la comprimen poco
  //    (D[i] alto → la I "resiste"); el ÚLTIMO (D[LAST]≈0) la APLASTA a ras del piso.
  const LAST = D.length - 1
  for (let i = 1; i <= LAST; i++) {
    const upMs = BASE_BOP_UP_MS[i] * c.bopSpeedScale
    const downMs = BASE_BOP_DOWN_MS[i] * c.bopSpeedScale
    const apex = top + BASE_BOP_HOP[i] * c.bopHopScale + seat
    // SUBE: la POSICIÓN es un solo arco outQuad a la cima. La ESCALA va desincronizada
    //   por keyframes: el estirón pica a ~60% del ascenso y ya vuelve hacia ~1.0 al apex.
    tl.add(state, {
      y: apex,
      scaleY: [
        { to: 1.2, duration: upMs * 0.6, ease: 'outQuad' },
        { to: 1.04, duration: upMs * 0.4, ease: 'linear' },
      ],
      scaleXZ: [
        { to: 0.88, duration: upMs * 0.6, ease: 'outQuad' },
        { to: 0.98, duration: upMs * 0.4, ease: 'linear' },
      ],
      ease: 'outQuad',
      duration: upMs,
    })
    // La I rebota a su forma con jiggle elástico, desfasada +20ms del up.
    tl.add(state, { iScaleY: 1, iScaleXZ: 1, ease: JIGGLE, duration: upMs }, '<+=20')
    // CAE: la POSICIÓN baja inQuad y la escala arranca en tránsito al squash (0.78). El
    //   down arranca en el apex (offset para descontar el +20ms del jiggle anterior).
    tl.add(state, { y: top * D[i] + seat, scaleY: 0.78, scaleXZ: 1.18, iScaleY: D[i], iScaleXZ: w(D[i]), ease: 'inQuad', duration: downMs }, '<+=' + (upMs - 20))
  }

  // 6. La I queda APLASTADA con un temblequeo residual (rebota un toque) antes de quedar
  //    quieta; el saltarín se asienta parado encima en paralelo.
  tl.add(state, { y: top * D[LAST] + seat, scaleY: 1, scaleXZ: 1, ease: 'outQuad', duration: 360 })
  tl.add(state, { iScaleY: D[LAST] + 0.06, ease: 'outQuad', duration: 80 }, '<')
    .add(state, { iScaleY: D[LAST], ease: JIGGLE_SOFT, duration: 460 })

  // 7. (lámpara) Ya aplastada la I, el CUERPO queda quieto (bodyYaw se mantiene en
  //    jumpYaw, donde quedó tras el salto) y SÓLO inclina la cabeza (headPitch →
  //    endHeadPitch), fluido.
  if (lookBeats) {
    tl.add(state, { headPitch: c.endHeadPitch, ease: 'inOutSine', duration: c.lookCamMs })
  }
  return tl
}
