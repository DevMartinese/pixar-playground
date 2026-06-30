// ⚠️ COPIA con FIX del bop loop (Paso 5) — usada SOLO por la ruta /fixar.
// Idéntica a jumpAnimation.ts salvo el Paso 5: un único tween de `y` por bop
// (sin el solape de 20ms que clavaba la cima). Ver comentario en el Paso 5.
import { createTimeline } from 'animejs'
import type { Mesh, Object3D } from 'three'
// Adapter three: para animar la escala de la malla de la "I" en el mismo timeline.
import './animeAdapter'

// Salto con gravedad real: sube DESACELERANDO (outQuad → pierde velocidad) y cae
// ACELERANDO (inQuad). Asentamiento elástico (estilo "i squish") para la I.
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

// Modos del CRUCE (Paso 1) — sólo /fixar, para comparar en vivo:
//  'actual' = addHop tal cual (hang 120ms, se siente entrecortado en la cima)
//  'A'      = addHop con hangMs reducido (50ms) → menos congelamiento en la cima
//  'B'      = addHopContinuous → ascenso+hang+caída fusionados en UN tween de y
export type CrossMode = 'actual' | 'A' | 'B'
const VARIANT_A_HANG_MS = 50

// Variante B (vuelo continuo): reemplaza los 3 beats de vuelo (ascenso + hang +
// caída) por UN SOLO tween de `y` (joroba senoidal, misma técnica que el bop), con
// x PAREJA en todo el vuelo y stretch que vuelve a neutro en movimiento (sin escala
// plana congelada). Mantiene intactos anticipación, hold, impacto y recuperación.
function addHopContinuous(
  tl: ReturnType<typeof createTimeline>,
  state: JumpState,
  params: JumpParams,
  x0: number,
  step: number,
) {
  const bendMax = params.bendDeg * DEG
  const bendFlight = params.flightBendDeg * DEG
  const airMs = params.ascendMs + params.hangMs + params.fallMs
  const upFrac = params.ascendMs / airMs
  tl
    // anticipación + hold (intactos): se agacha y encorva para tomar impulso.
    .add(state, { scaleY: params.squashY, scaleXZ: params.squashXZ, bend: bendMax, ease: 'outQuad', duration: params.anticipateMs })
    .add(state, { scaleY: params.squashY, ease: 'linear', duration: params.holdMs })
    // VUELO CONTINUO: un único tween. `y` = joroba senoidal (sin pausa en la cima),
    // `x` pareja x0→x0+step (sin el quiebre ascenso/caída), stretch desincronizado.
    .add(state, {
      y: {
        from: 0, to: 1, ease: 'linear', duration: airMs,
        modifier: (p: number) => {
          const phase = p < upFrac ? (p / upFrac) * 0.5 : 0.5 + ((p - upFrac) / (1 - upFrac)) * 0.5
          return params.hopHeight * Math.sin(phase * Math.PI)
        },
      },
      x: { to: x0 + step, ease: 'linear', duration: airMs },
      scaleY: [{ to: params.stretchY, duration: airMs * 0.3, ease: 'outQuad' }, { to: 1, duration: airMs * 0.7, ease: 'inQuad' }],
      scaleXZ: [{ to: params.stretchXZ, duration: airMs * 0.3, ease: 'outQuad' }, { to: 1, duration: airMs * 0.7, ease: 'inQuad' }],
      bend: [{ to: bendFlight, duration: airMs * 0.3 }, { to: 0, duration: airMs * 0.7 }],
      duration: airMs,
    })
    // impacto + recuperación elástica (intactos).
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
  opts: { lookBeats?: boolean; crossMode?: CrossMode } = {},
  c: JumpChoreo = DEFAULT_CHOREO,
  params: JumpParams = DEFAULT_JUMP,
) {
  const lookBeats = opts.lookBeats ?? false
  const crossMode = opts.crossMode ?? 'actual'
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

  // 1. Cruce. El modo elige el "vuelo" de cada salto (toggle de /fixar). En todos,
  //    cada salto avanza `step` en x y termina en x0+step → el x final del cruce
  //    (7·step = xPast) NO cambia entre variantes: el Paso 4 arranca en el mismo lugar.
  const crossParams = crossMode === 'A' ? { ...params, hangMs: VARIANT_A_HANG_MS } : params
  for (let i = 0; i < HOPS_CROSS; i++) {
    if (crossMode === 'B') addHopContinuous(tl, state, crossParams, i * step, step)
    else addHop(tl, state, crossParams, i * step, step)
  }

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
    const totalMs = upMs + downMs
    const apex = top + BASE_BOP_HOP[i] * c.bopHopScale + seat
    const base = top * D[i - 1] + seat // parte del golpe anterior
    const land = top * D[i] + seat // llega un poco más hundido
    const arc = apex - base
    const upFrac = upMs / totalMs // el pico del arco cae donde antes terminaba la subida

    // Altura del PIE en función del progreso `p` (0..1) del golpe: recorrido vertical
    // base→land (lineal en p) + joroba senoidal. El remapeo de `p` con upFrac hace que
    // el pico caiga en la cima REAL (no en p=0.5), respetando que upMs ≠ downMs.
    // FIX del "quieto en la cima": es UN SOLO tween de `y` (sin el solape de 20ms que
    // antes pisaba `state.y` y lo clavaba en el apex) → el apex es un punto INTERIOR
    // del modifier, `p` no se detiene ahí → sin hang.
    const footY = (p: number) => {
      const travel = base + (land - base) * p
      const phase = p < upFrac ? (p / upFrac) * 0.5 : 0.5 + ((p - upFrac) / (1 - upFrac)) * 0.5
      return travel + arc * Math.sin(phase * Math.PI)
    }
    // FIX del "la I no reacciona bien": antes la I se hundía con su PROPIO tween inQuad,
    // desincronizado de la caída senoidal del pie → la I deformaba por su cuenta. Acá la
    // I se DERIVA del pie: el tope de la I (top·iScaleY) ES la altura del pie mientras
    // éste presione por debajo de su altura de reposo (top). min(1, …) → cuando el pie
    // vuela por encima de la I, ésta descansa entera (1); cuando hunde, la sigue exacta.
    // max(D[i], …) limita el aplastamiento del golpe. Pie e I quedan SIEMPRE pegados.
    const iSquash = (p: number) => Math.min(1, Math.max(D[i], (footY(p) - seat) / top))
    tl.add(state, {
      y: { from: 0, to: 1, ease: 'linear', duration: totalMs, modifier: footY },
      // La I sigue al pie (mismo modifier) → contacto exacto, sin desincronización.
      iScaleY: { from: 0, to: 1, ease: 'linear', duration: totalMs, modifier: iSquash },
      iScaleXZ: { from: 0, to: 1, ease: 'linear', duration: totalMs, modifier: (p: number) => w(iSquash(p)) },
      // estirón al despegar (pico ~35% del tween) → squash al caer, en movimiento.
      scaleY: [
        { to: 1.2, duration: totalMs * 0.35, ease: 'outQuad' },
        { to: 0.78, duration: totalMs * 0.65, ease: 'inQuad' },
      ],
      scaleXZ: [
        { to: 0.88, duration: totalMs * 0.35, ease: 'outQuad' },
        { to: 1.18, duration: totalMs * 0.65, ease: 'inQuad' },
      ],
      duration: totalMs,
    })
  }

  // 6. La I queda APLASTADA con un temblequeo residual (rebota un toque) antes de quedar
  //    quieta; el saltarín se asienta parado encima en paralelo.
  tl.add(state, { y: top * D[LAST] + seat, scaleY: 1, scaleXZ: 1, ease: 'outQuad', duration: 360 })
  tl.add(state, { iScaleY: D[LAST] + 0.06, ease: 'outQuad', duration: 80 }, '<')
    .add(state, { iScaleY: D[LAST], ease: JIGGLE_SOFT, duration: 460 })

  // 7. (lámpara) Ya aplastada la I, el CUERPO queda quieto (bodyYaw se mantiene en
  //    jumpYaw, donde quedó tras el salto) y SÓLO se mueve la cabeza.
  if (lookBeats) {
    // Valores del "gesto curioso" previo a mirar a la cámara.
    const PRE_TILT = -1.15 // ladeo de la cabeza (headTilt) que se mantiene durante el cabeceo
    const PRE_TILT_MS = 420 // tardanza en ladear
    const PRE_PITCH = 0.3 // amplitud del cabeceo (headPitch oscila -PRE_PITCH ↔ +PRE_PITCH)
    const PRE_PITCH_MS = 340 // duración de cada medio-cabeceo
    const PRE_PITCH_REPS = 2 // cuántos vaivenes completos

    // 7a. Ladea la cabeza (headTilt → -1.9) y la MANTIENE ahí durante el cabeceo.
    tl.add(state, { headTilt: PRE_TILT, ease: 'inOutSine', duration: PRE_TILT_MS })

    // 7b. Ya ladeada, cabecea: headPitch va -0.3 → 0.3 → -0.3 … un rato (curioseando).
    tl.add(state, { headPitch: -PRE_PITCH, ease: 'inOutSine', duration: PRE_PITCH_MS })
    for (let i = 0; i < PRE_PITCH_REPS; i++) {
      tl.add(state, { headPitch: PRE_PITCH, ease: 'inOutSine', duration: PRE_PITCH_MS })
        .add(state, { headPitch: -PRE_PITCH, ease: 'inOutSine', duration: PRE_PITCH_MS })
    }

    // 7c. Se acomoda: el tilt vuelve a 0 y la cabeza mira a la cámara (headPitch →
    //     endHeadPitch), ambos en paralelo ('<'), fluido.
    tl.add(state, { headTilt: 0, ease: 'inOutSine', duration: c.lookCamMs })
    tl.add(state, { headPitch: c.endHeadPitch, ease: 'inOutSine', duration: c.lookCamMs }, '<')
  }
  return tl
}
