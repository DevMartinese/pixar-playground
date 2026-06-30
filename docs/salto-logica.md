# Lógica del salto (cilindro / lámpara Luxo) — para debatir

Documento de referencia de cómo está implementada la animación del salto en la
escena PIXAR, con foco en el **salto encima de la "I"** y su aplaste.

Archivo fuente: `src/scene/jumpAnimation.ts`. Se aplica en `src/scene/Jumper.tsx`
(cilindro) y `src/scene/JumperLamp.tsx` (lámpara).

---

## 1. Arquitectura: "state-driven" + anime.js v4

No animamos los objetos 3D directamente. En cambio:

1. Hay un objeto JS plano `JumpState` con números (posición, escala, ángulos…).
2. Una **timeline de anime.js** anima esos números en el tiempo.
3. El componente React lee `state` **cada frame** (`useFrame`) y lo aplica al
   grupo 3D (posición/escala/rotaciones) y a la malla de la "I".

**Por qué así:**
- El `bend` (encorvado real de la geometría del cilindro) no es una transform,
  así que viaja por el mismo timeline sincronizado con todo lo demás.
- Permite **scrubear** (mover una cabecita de reproducción): como el estado se
  aplica por frame, al hacer `seek()` todo sigue la cabecita. (El adapter three
  de anime sólo escribe la malla al *reproducir*, no al *seek* — por eso la "I"
  también es state-driven, ver §6).

### `JumpState` (los números que se animan)
| campo | qué es |
|---|---|
| `x, y, z` | posición del saltarín (z = avance hacia el plano del texto para treparse a la I) |
| `scaleY, scaleXZ` | squash & stretch del cuerpo |
| `bend` | encorvado hacia adelante en radianes (sólo cilindro; deforma la geometría) |
| `bodyYaw` | giro del CUERPO entero (la "mirada" de la lámpara) |
| `lowerBlend` | 0..1 interpola el brazo inferior de la pose base → ángulo de salto |
| `headTilt` | offset del cuello (el "scaneo" sobre la I) |
| `headPitch` | offset de inclinación de cabeza (sólo se anima al final) |
| `headSpin` | giro de cuello — NUNCA se anima (pose estática) |
| `iScaleY, iScaleXZ` | **squash de la "I"** (1 = entera) |

Estado inicial: todo en 0 / escalas en 1 (`createJumpState()`).

---

## 2. Dos timelines

- **`buildJumpTimeline(state)`** — bucle infinito: el saltarín cruza la escena
  saltando una y otra vez. Se usa cuando NO hay "I" (fallback).
- **`buildJumpOntoI(state, iMesh, opts, choreo, params)`** — **el principal**:
  cruza, salta ENCIMA de la I y la aplasta. `loop: false` (one-shot, la I queda
  aplastada). Con `opts.lookBeats = true` (lámpara) agrega las "miradas".

El cilindro usa `buildJumpOntoI(..., { lookBeats: false })`; la lámpara
`{ lookBeats: true }`.

---

## 3. Anatomía de UN salto (`addHop`)

Cada salto del cruce es esta secuencia de beats (principios de animación clásica):

1. **Anticipación** (`anticipateMs` 240ms, `outQuad`): se agacha (`squashY`) y
   se encorva (`bendDeg`) — toma impulso.
2. **Hold** (`holdMs` 90ms, `linear`): mantiene el agache un instante.
3. **Despegue + ascenso** (`ascendMs` 320ms, `outQuad`): empuje, **estirón**
   (`stretchY`), se endereza, avanza medio paso y sube a la cima (`hopHeight`).
4. **Hang** (`hangMs` 120ms, `inOutSine`): flota en la cima, escala neutra.
5. **Caída** (`fallMs` 280ms, `inQuad`): baja **acelerando**, completa el paso.
6. **Impacto** (`landMs·0.2`, `outQuad`): squash fuerte al tocar el suelo.
7. **Recuperación** (`landMs·0.8`, `outElastic`): rebote elástico a neutro.

> **Easing clave:** subir = `outQuad` (desacelera, "pierde velocidad"); caer =
> `inQuad` (acelera, "se desploma"). Es gravedad real.

---

## 4. La coreografía "salto encima de la I" (`buildJumpOntoI`) — PASO A PASO

Esta es la parte importante. La timeline se arma en este orden:

### Paso 1 — Cruce
`HOPS_CROSS = 7` saltos (`addHop`) desde el borde hasta **pasar** la I.
- La lámpara **sobrepasa** la I por `overshoot` (1.7) para después frenar y
  mirarla. El cilindro llega justo (`+0.4`).
- `xPast = iLocalX + overshoot`; cada salto avanza `xPast / 7`.

### Paso 2 — Frena
`brakeMs` (260ms, `linear`): se detiene tras pasar la I.

### Paso 3 — (sólo lámpara) Mira la I
Gira el **CUERPO entero** (`bodyYaw → lookIYaw = -2.0`) en `lookIMs` (380ms,
`inOutSine`) + un pequeño hold. **No** se anima la cabeza (pitch/spin).

### Paso 3b — (sólo lámpara) Scaneo
Ya girada hacia la I, **cabecea el cuello** (`headTilt`) sobre ella `scanReps`
(2) veces, como examinándola, y vuelve a neutro. Amplitud `scanTilt` (0.5),
duración `scanMs` (220ms) por medio-cabeceo.

### Paso 4 — Salta ENCIMA de la I
- **Anticipación** (`anticipateMs` 260ms, `outQuad`): se agacha.
- (Lámpara, en PARALELO `'<'`): sigue girando el cuerpo `bodyYaw → jumpYaw`
  (-3.14, el mínimo) y lleva el brazo inferior a `jumpLowerAngle` (0.35),
  durante `jumpYawMs` (650ms).
- **Ascenso en arco** (`ascendMs` 260ms, `outQuad`): sube a
  `y = topI + jumpArc` (0.4 extra sobre el tope de la I), vuelve en x al centro
  de la I, entra en z sobre el plano del texto, **estira**. **Sin hold previo**
  (saqué el hold para que no haya pausa).

### Paso 4b — PRIMER golpe (la caída)
**Caída** (`fallMs` 260ms, `inQuad`): cae sobre el tope de la I y la **hunde**
a `deflate[0]` (0.8). El saltarín baja a `y = topI · deflate[0]` y la I baja a
`iScaleY = deflate[0]` **en el MISMO tween** → perfectamente sincronizados (no
la traspasa). El cuerpo squashea (`scaleY 0.92`).

### Paso 5 — Golpes 2 a 5 (el "jelly" y el aplaste final)
Loop. Cada golpe:
- **Sube** (rebote, `BASE_BOP_UP_MS[i]`, `outQuad`): el saltarín salta sobre la I
  a `apex = topI + BASE_BOP_HOP[i]`, estirándose (`scaleY 1.2`).
- **La I rebota** a su forma (`iScaleY → 1`) con **jiggle elástico**
  (`outElastic(1.6, 0.5)`), EN PARALELO `'<'` → se la ve menearse mientras el
  saltarín está en el aire.
- **Cae** (`BASE_BOP_DOWN_MS[i]`, `inQuad`): aterriza **comprimido**
  (`scaleY 0.78`, = resorte cargado para el próximo salto, sin hold) y hunde la I
  a `deflate[i]` en sincronía. El próximo "sube" dispara directo desde acá →
  flujo continuo, sin pausa muerta entre golpes.

**Clave del efecto:** los primeros 4 `deflate` son **altos** (0.8, 0.78, 0.76,
0.74) → la I sólo se comprime un poco y **resiste** (jelly, vuelve a su forma).
El **5º** es `0.02` → la **aplasta a ras del piso** y NO se recupera.

`BASE_BOP_HOP = [_, 3.0, 2.7, 2.4, 2.1]` (alturas de rebote)
`BASE_BOP_UP_MS = [_, 360, 340, 320, 300]` (subidas)
`BASE_BOP_DOWN_MS = [_, 440, 420, 400, 380]` (caídas, un poco más largas = pesan)
(el índice 0 no se usa; el 1er golpe es la caída del paso 4b)

### Paso 6 — La I queda aplastada (con temblequeo)
El saltarín se asienta parado encima (`y = topI · deflate[5]`, `scaleY → 1`).
La I hace un **temblequeo residual** (mini-rebote a `+0.06` y `outElastic(2.11,
0.61)`) antes de quedar quieta. Queda plana (no se recupera).

### Paso 7 — (sólo lámpara) Mira a cámara / final
El cuerpo queda quieto (`bodyYaw` se mantiene en `jumpYaw`) y SÓLO inclina la
cabeza (`headPitch → endHeadPitch = 1.5`) en `lookCamMs` (600ms).

---

## 5. El aplaste de la I — cómo NO queda hueco ni la traspasa

- **Tope real medido:** el pie del saltarín (y=0 local) sigue `topI · deflate`.
  `topI` se **mide del bounding box** de la malla de la I (≈1.4), NO un valor
  fijo (antes usábamos 2.0 → el pie quedaba flotando).
- `topI · deflate` ES exactamente el tope de la I escalada → tocan sin hueco.
- `seatY` (0 por defecto): offset fino. <0 hunde el pie en la I.
- **Sincronía:** el `y` del saltarín y el `iScaleY` de la I se animan en el
  **mismo tween** (o en paralelo con `'<'`) → bajan juntos, sin traspaso.
- **Aplaste sólo en altura:** `widen = 0` → la I se hunde en Y sin ensancharse
  en X/Z.

La I es **state-driven** (`iScaleY/iScaleXZ` en `JumpState`, aplicado por frame
en el componente) — así también responde al scrub/seek, no sólo al play.

---

## 6. Mapeo de coordenadas

El saltarín está en un grupo exterior en `world (x≈7.55, z≈1.8)` rotado **180°
en Y**. Por eso las coords LOCALES se invierten:
- `world x = 7.55 − localx`
- `world z = 1.8 − localz`

La I está en `worldX ≈ −3.885` → `iLocalX ≈ 11.44`. Las letras miden ~2 de alto
(base en y=0); el glyph real de la "I" mide ~1.4.

---

## 7. Tabla de parámetros (`DEFAULT_CHOREO`, todos tuneables en Leva)

| param | default | qué hace |
|---|---|---|
| `iLocalX` | 11.44 | x local de la I |
| `iTopY` | 2.0 | fallback del tope (se usa el medido del bbox) |
| `seatY` | 0 | apoyo fino (<0 hunde el pie en la I) |
| `iLocalZ` | 1.8 | z para caer sobre el plano del texto |
| `overshoot` | 1.7 | cuánto pasa la I antes de frenar (lámpara) |
| `lampScale` | 1.6 | escala de la lámpara |
| `lookIYaw` | -2.0 | giro del cuerpo para mirar la I |
| `endHeadPitch` | 1.5 | inclinación final de la cabeza |
| `scanTilt` / `scanMs` / `scanReps` | 0.5 / 220 / 2 | el "scaneo" del cuello |
| `jumpYaw` | -3.14 | giro del cuerpo al saltar encima (mín total) |
| `jumpYawMs` | 650 | duración de ese giro (en paralelo al ascenso) |
| `jumpLowerAngle` | 0.35 | ángulo del brazo inferior al saltar |
| `brakeMs` | 260 | hold del frenado |
| `lookIMs` / `lookCamMs` | 380 / 600 | duración mira-I / mira-cámara |
| `jumpArc` | 0.4 | altura extra del arco al saltar sobre la I |
| `anticipateMs` | 240 | anticipación del salto-encima |
| `ascendMs` | 260 | ascenso del salto-encima |
| `fallMs` | 260 | caída del salto-encima (1er golpe) |
| `deflate` | [0.8, 0.78, 0.76, 0.74, 0.02] | scaleY de la I en cada golpe |
| `bopHopScale` | 1 | multiplica las alturas de rebote |
| `bopSpeedScale` | 1 | multiplica las duraciones de los golpes (mayor = más lento) |
| `widen` | 0 | ensanche X/Z de la I (0 = aplaste puro vertical) |

---

## 8. Punto en discusión: el "estático en la cima"

El reclamo recurrente: en los rebotes sobre la I, **la cima se siente estática**.

**Por qué pasa (físico):** cualquier arco SUAVE (subir desacelerando `outQuad` +
caer acelerando `inQuad`) tiene **velocidad cero en la cima**. Eso es gravedad
real. El "estático" es ese instante de velocidad cero.

**Tensión de requisitos:**
- "que salte, pierda velocidad y caiga" → pide desacelerar al subir (`outQuad`),
  lo que **inevitablemente** llega a velocidad 0 arriba.
- "que no sea estático en la cima, una sola acción" → pide que ese instante no se
  note.

**Palancas posibles (a debatir):**
1. **Arco más rápido / más bajo** → el instante de velocidad 0 dura menos en
   tiempo real (se prueba bajando `BASE_BOP_HOP` y las duraciones, o subiendo
   `altura rebotes` y bajando `lentitud golpes` en Leva). *(Probado, el usuario
   lo revirtió.)*
2. **Apex "duro" (lineal)** → velocidad constante subiendo y bajando, vértice
   instantáneo, pero se siente anguloso/mecánico. *(Probado, no convenció.)*
3. **Easing tipo "pop" (`cubicBezier`)** → llega rápido arriba pero **se queda
   pegado** en la cima (peor). *(Probado, revertido.)*
4. **Arco continuo de UN solo tween (parábola/seno vía `modifier`)** → matemática-
   mente tiene el mismo cero en la cima; sólo ayuda si además es rápido.

> Conclusión para debatir: con un arco suave el cero en la cima es inevitable;
> la única forma de que NO se note es que el arco sea **rápido** (poco tiempo
> arriba) o aceptar un vértice más "duro". Hay que elegir el equilibrio.

---

## 9. La lámpara Luxo — estructura, jerarquía y refs

Archivo: `src/luxoArmada/LuxoLampModel.tsx`. Es un modelo **procedural** (geometrías
revolución/extrude/CSG, sin importar mallas). Jerarquía de arriba hacia abajo
(cada nivel es un `<group>` con su rotación = un joint articulado):

```text
<group> (raíz del modelo)
 ├─ Foot                       (base, apoyada en y=0)
 └─ group rot.z = lowerAngle   ← BRAZO INFERIOR   [ref: lowerRef]
     ├─ Pivot + LinkPair (par de barras)
     └─ group rot.z = elbowAngle   ← CODO
         ├─ Pivot + LinkPair
         └─ group rot.z = headTilt ← CUELLO       [ref: tiltRef]
             ├─ Pivot
             └─ group rot = [headPitch, headSpin, 0]  ← CABEZA  [ref: headRef]
                 ├─ HeadNeck
                 └─ group (offset 0.05)
                     ├─ Head (pantalla, boca abierta, DoubleSide)
                     ├─ Reflector
                     ├─ Bulb (emissive)
                     ├─ spotLight (foco volumétrico drei) + target
                     └─ sprite (halo glow del bulbo)
```

Constantes de geometría: `NECK_TOP = 0.3`, `SEG = 0.368` (largo del segmento de
brazo), `ZHALF = 0.06` (medio gap del par de barras en Z).

**Tres refs expuestos** para que la animación toque joints puntuales por frame:

| ref | grupo que controla | eje | qué anima |
|---|---|---|---|
| `lowerRef` | brazo inferior | rot.z | `lowerBlend` (pose↔ángulo de salto) |
| `tiltRef` | cuello | rot.z | `headTilt` (el "scaneo" de la I) |
| `headRef` | cabeza | rot.x / rot.y | `headPitch` (final) / `headSpin` (fijo) |

El `bodyYaw` (la "mirada" = girar el cuerpo entero) NO toca un joint del modelo:
se aplica al **grupo animado externo** (`animRef`), que contiene a todo el modelo.

---

## 10. La pose articulada (`LampPose`)

Archivo: `src/luxoArmada/lampPose.ts`. Es la pose ESTÁTICA base; la animación del
salto se **suma** (offset) o **interpola** sobre ella.

| campo | default | qué es |
|---|---|---|
| `lowerAngle` | 0.55 | ángulo del brazo inferior (base del lerp del salto) |
| `elbowAngle` | -1.0 | ángulo del codo (NO se anima) |
| `headTilt` | -1 | inclinación base del cuello (el scaneo suma offset) |
| `headPitch` | 0 | pitch base de la cabeza (el final suma offset) |
| `headSpin` | 0 | giro base del cuello (NUNCA se anima) |

---

## 11. Cómo se aplica el `JumpState` a la lámpara — POR FRAME

Archivo: `src/scene/JumperLamp.tsx`, dentro de `useFrame`. El grupo EXTERIOR está
en `world (x≈7.55, z≈1.8)` rotado **180° en Y**. El grupo interno `animRef` es el
que recibe toda la animación:

```ts
const s = stateRef.current          // el JumpState que anima anime.js
const scale = choreo.lampScale       // 1.6

g.position.x = s.x
g.position.y = s.y
g.position.z = s.z
g.rotation.y = bodyYaw + s.bodyYaw   // mirada = pose base (slider) + animación
g.scale.set(scale * s.scaleXZ, scale * s.scaleY, scale * s.scaleXZ) // squash&stretch

// cabeza: pitch = pose + offset animado; spin = sólo pose
headRef.rotation.x = pose.headPitch + s.headPitch
headRef.rotation.y = pose.headSpin
// cuello (scaneo): tilt = pose + offset animado
tiltRef.rotation.z = pose.headTilt + s.headTilt
// brazo inferior: LERP de la pose base al ángulo de salto, por lowerBlend (0..1)
lowerRef.rotation.z = pose.lowerAngle * (1 - s.lowerBlend) + choreo.jumpLowerAngle * s.lowerBlend
// la I se aplasta por frame (state-driven)
iMesh.scale.set(s.iScaleXZ, s.iScaleY, s.iScaleXZ)
```

**Clave:** TODO lo de la lámpara sale de `s` (el `JumpState`) leído cada frame.
Nada se anima "directo" sobre los objetos 3D. Por eso el scrub/seek funciona.

---

## 12. Cómo interactúa anime.js (v4) acá

1. **El objeto que anime anima es `JumpState`** (números planos JS), NO los Object3D.
   `import { createTimeline } from 'animejs'`. La timeline hace `tl.add(state, {...})`.
2. **`import './animeAdapter'`** — el adapter three de anime existe en el repo, pero
   la "I" se pasó a **state-driven** (`iScaleY/iScaleXZ` en el `JumpState`) justamente
   porque el adapter sólo escribe la malla al *reproducir*, no al hacer `seek()`. Así
   todo (incluida la I) sigue la cabecita del scrub.
3. **Construcción y ciclo de vida** (en `JumperLamp.tsx`, `useEffect([replayKey])`):
   - `Object.assign(state, createJumpState())` → resetea el estado.
   - `tl = buildJumpOntoI(state, iMesh, { lookBeats: true }, choreo)`.
   - `tlRef.current = tl` → lo expone para el panel (scrub/pausa).
   - cleanup: `tl.revert()` + restaura `iMesh.scale` a 1.
4. **Posicionamiento en la timeline** (clave para los bops): anime v4 acepta como
   3er argumento de `.add(...)` una posición:
   - `'<'` = arranca junto al INICIO del tween anterior (paralelo).
   - `'<+=N'` / `'<-=N'` = inicio del anterior ± N ms.
   - por defecto = al FINAL del último tween agregado (encadenado).
   - Y cada propiedad puede tener su **array de keyframes** propio `[{to, duration, ease}, …]`.
5. **Eases usados:** `outQuad` (subir, desacelera), `inQuad` (caer, acelera),
   `inOutSine` (miradas), `outElastic(amp, period)` para el jiggle de la I
   (`JIGGLE = 'outElastic(1.6, 0.5)'`, `JIGGLE_SOFT = 'outElastic(2.11, 0.61)'`).
6. **Reproducción / scrub** (en `src/scene/useJumpDebug.ts`): un `useFrame` hace
   `tl.play()/tl.pause()` y, pausado, `tl.seek(tiempo · tl.duration)`. Hay loop
   opcional (re-dispara `replayKey` tras `tl.duration`).

---

## 13. El bop loop ACTUAL (código exacto) y el problema del "estático"

Esto es lo que está hoy en `buildJumpOntoI`, Paso 5 (`D = choreo.deflate`,
`top` = tope medido de la I, `seat = choreo.seatY`, `w(sy)` = ensanche, hoy `widen=0`):

**Estado ACTUAL = se aplicó el cambio (A) — arco de POSICIÓN con curvas seno/coseno**
(reemplazó el `outQuad`/`inQuad`). El resto (escala desincronizada, jiggle de la I,
press a `D[i]`, offsets `'<+=20'` / `'<+='+(upMs-20)`) quedó igual:

```ts
const LAST = D.length - 1
for (let i = 1; i <= LAST; i++) {
  const upMs = BASE_BOP_UP_MS[i] * c.bopSpeedScale     // [_,360,340,320,300]
  const downMs = BASE_BOP_DOWN_MS[i] * c.bopSpeedScale  // [_,440,420,400,380]
  const apex = top + BASE_BOP_HOP[i] * c.bopHopScale + seat  // hop [_,3.0,2.7,2.4,2.1]
  const base = top * D[i - 1] + seat   // y de partida (golpe anterior)
  const land = top * D[i] + seat       // y de llegada (hunde la I un poco más)

  // (A) SUBE con curva SENO: desacelera hacia la cima. ESCALA desincronizada por keyframes.
  tl.add(state, {
    y: { from: 0, to: 1, ease: 'linear', duration: upMs,
         modifier: (p) => base + (apex - base) * Math.sin((p * Math.PI) / 2) },
    scaleY:  [{ to: 1.2,  duration: upMs * 0.6, ease: 'outQuad' }, { to: 1.04, duration: upMs * 0.4, ease: 'linear' }],
    scaleXZ: [{ to: 0.88, duration: upMs * 0.6, ease: 'outQuad' }, { to: 0.98, duration: upMs * 0.4, ease: 'linear' }],
    duration: upMs,
  })
  // La I rebota (jiggle elástico) DESFASADA +20ms del up.
  tl.add(state, { iScaleY: 1, iScaleXZ: 1, ease: JIGGLE, duration: upMs }, '<+=20')
  // (A) CAE con curva COSENO: acelera desde la cima. Escala (0.78) y press de la I (D[i]) en inQuad.
  tl.add(state, {
    y: { from: 0, to: 1, ease: 'linear', duration: downMs,
         modifier: (p) => apex + (land - apex) * (1 - Math.cos((p * Math.PI) / 2)) },
    scaleY: 0.78, scaleXZ: 1.18, iScaleY: D[i], iScaleXZ: w(D[i]),
    ease: 'inQuad', duration: downMs,
  }, '<+=' + (upMs - 20))
}
```

### El problema PERSISTE: (A) cambió el arco pero NO sacó el v=0 en la cima

El usuario reporta que **sigue quedándose quieto un instante en el aire**. La razón es
matemática y es la clave para el agente del browser:

> **Cualquier arco SUAVE que llega a una cima tiene velocidad CERO en la cima** (es el
> máximo de una función derivable → su derivada = 0 ahí). Da igual la curva: `outQuad`/
> `inQuad`, parábola, o seno/coseno — TODAS pasan por v=0 en el apex.

Verificación de las curvas (A):

- **Subida** `sin(p·π/2)` → velocidad ∝ `cos(p·π/2)`; en `p=1` (cima) `cos(π/2)=0` → **v=0**.
- **Caída** `1−cos(p·π/2)` → velocidad ∝ `sin(p·π/2)`; en `p=0` (cima) `sin(0)=0` → **v=0**.

La premisa de (A) era que con **aceleración no nula** en la cima no se congelaría. La
aceleración SÍ es no nula (la curva no es plana), pero la **velocidad sigue siendo 0**,
y eso es lo que se ve como pausa. (A) cambió la *forma* del arco, no el hecho de que la
lámpara se detiene un instante arriba. Por eso el "quieto en el aire" continúa.

**Qué SÍ saca o disimula el v=0 (lo único que funciona):**

1. **Menos tiempo cerca de la cima** → arco **más rápido y/o más bajo** (bajar
   `BASE_BOP_UP_MS`/`DOWN_MS` y/o `BASE_BOP_HOP`). El v=0 sigue existiendo pero dura
   tan poco que se lee como natural (los saltos reales SÍ tienen un hang breve arriba).
   *(Probado bajando esos números; el usuario lo revirtió — pero el equilibrio justo
   quizá no se encontró.)*
2. **Vértice "duro" (v≠0 en la cima):** un **quiebre de velocidad** en el apex — p.ej.
   subir acelerando + caer acelerando, o solapar ~30-50ms la subida y la caída. La
   lámpara cruza la cima a velocidad máxima, sin pausa, pero el vértice se ve más
   "rebote/snappy" que "flotar". Es el trade-off real: o hay un instante de v=0 (hang
   suave) o hay un quiebre (sin hang pero más duro).
3. **Aceptar el hang** como parte del estilo Luxo (los saltos de Luxo Jr. flotan un
   toque arriba) y enfocar la vida en el squash & la I.

> **Conclusión para el agente:** el "quieto en el aire" NO es un bug de la curva ni se
> arregla cambiando seno/coseno por otra fórmula suave — el v=0 en la cima es inherente.
> Las únicas salidas reales son (1) arco más rápido/bajo (hang breve, natural) o (2) un
> vértice con quiebre de velocidad (sin hang pero más snappy). Hay que **elegir** entre
> "natural con hang breve" y "sin hang pero más duro". El cambio (B) (modelo de contacto
> de la I por `max()`) es ortogonal: mejora la composición pie↔I y la vida de la I, pero
> **no** toca el hang de la posición.

---

## 15. Código REAL completo (verbatim) — `src/scene/jumpAnimation.ts`

Acá está el código tal cual está hoy, para que el agente lo lea entero sin huecos. El
"se queda en el aire la lámpara" ocurre en el **Paso 5 (bop loop)**, dentro de esta función.

### Constantes del cruce y los bops

```ts
const DEG = Math.PI / 180

// Asentamiento elástico (estilo "i squish") para la I.
const JIGGLE = 'outElastic(1.6, 0.5)'
const JIGGLE_SOFT = 'outElastic(2.11, 0.61)'

// Params del CRUCE (un salto normal, addHop). Defaults:
export const DEFAULT_JUMP = {
  hopHeight: 1.7, hopStep: 1.9, hops: 8,
  squashY: 0.55, stretchY: 1.35, squashXZ: 1.4, stretchXZ: 0.86,
  bendDeg: 30, flightBendDeg: 6,
  anticipateMs: 240, holdMs: 90, ascendMs: 320, hangMs: 120, fallMs: 280, landMs: 440,
}

// Alturas/duraciones BASE de los REBOTES sobre la I (golpes 2..5). [0] no se usa.
const BASE_BOP_HOP    = [0, 3.0, 2.7, 2.4, 2.1]   // altura del rebote (apex = top + hop)
const BASE_BOP_UP_MS  = [0, 360, 340, 320, 300]   // duración de la SUBIDA
const BASE_BOP_DOWN_MS = [320, 440, 420, 400, 380] // duración de la CAÍDA
const HOPS_CROSS = 7 // saltos del cruce hasta pasar la I
```

### Un salto del cruce (`addHop`) — NO es el problema, va perfecto

```ts
function addHop(tl, state, params, x0, step) {
  const bendMax = params.bendDeg * DEG
  const bendFlight = params.flightBendDeg * DEG
  tl
    .add(state, { scaleY: params.squashY, scaleXZ: params.squashXZ, bend: bendMax, ease: 'outQuad', duration: params.anticipateMs })
    .add(state, { scaleY: params.squashY, ease: 'linear', duration: params.holdMs })
    .add(state, { y: params.hopHeight, x: x0 + step / 2, scaleY: params.stretchY, scaleXZ: params.stretchXZ, bend: bendFlight, ease: 'outQuad', duration: params.ascendMs })
    .add(state, { scaleY: 1, scaleXZ: 1, bend: 0, ease: 'inOutSine', duration: params.hangMs })   // hang explícito en el cruce
    .add(state, { y: 0, x: x0 + step, ease: 'inQuad', duration: params.fallMs })
    .add(state, { scaleY: params.squashY, scaleXZ: params.squashXZ, bend: 0, ease: 'outQuad', duration: params.landMs * 0.2 })
    .add(state, { scaleY: 1, scaleXZ: 1, ease: 'outElastic', duration: params.landMs * 0.8 })
}
```

### La función completa `buildJumpOntoI`

```ts
export function buildJumpOntoI(state, iMesh, opts = {}, c = DEFAULT_CHOREO, params = DEFAULT_JUMP) {
  const lookBeats = opts.lookBeats ?? false
  const tl = createTimeline({ loop: false })   // one-shot: la I queda aplastada al final
  const D = c.deflate                           // [0.8, 0.78, 0.76, 0.74, 0.02]
  const w = (sy) => 1 + (1 - sy) * c.widen       // ensanche X/Z (widen=0 → siempre 1)
  // Tope REAL de la I (alto del glyph, medido del bbox). El pie sigue top·deflate.
  const geo = iMesh.geometry
  if (geo && !geo.boundingBox) geo.computeBoundingBox()
  const top = geo?.boundingBox ? geo.boundingBox.max.y : c.iTopY   // ≈ 1.4
  const seat = c.seatY                                             // 0
  const xPast = c.iLocalX + (lookBeats ? c.overshoot : 0.4)
  const step = xPast / HOPS_CROSS

  // 1. CRUCE: 7 saltos hasta pasar la I.
  for (let i = 0; i < HOPS_CROSS; i++) addHop(tl, state, params, i * step, step)

  // 2. FRENA tras pasar la I.
  tl.add(state, { y: 0, ease: 'linear', duration: c.brakeMs })

  // 3. (lámpara) MIRA la I girando el cuerpo (bodyYaw → lookIYaw). La cabeza no se anima.
  if (lookBeats) {
    tl.add(state, { bodyYaw: c.lookIYaw, ease: 'inOutSine', duration: c.lookIMs })
      .add(state, { bodyYaw: c.lookIYaw, ease: 'linear', duration: 200 })
    // 3b. SCANEO del cuello (headTilt) sobre la I, un par de cabeceos, y vuelve a neutro.
    for (let i = 0; i < c.scanReps; i++) {
      tl.add(state, { headTilt: c.scanTilt, ease: 'inOutSine', duration: c.scanMs })
        .add(state, { headTilt: -c.scanTilt * 0.6, ease: 'inOutSine', duration: c.scanMs })
    }
    tl.add(state, { headTilt: 0, ease: 'inOutSine', duration: c.scanMs })
  }

  // 4. SALTA ENCIMA: anticipación (agache) → arco de entrada → cae = 1er golpe.
  if (lookBeats) {
    // en paralelo '<': sigue girando el cuerpo (→ jumpYaw -3.14) y baja el brazo (lowerBlend→1)
    tl.add(state, { bodyYaw: c.jumpYaw, lowerBlend: 1, ease: 'inOutSine', duration: c.jumpYawMs })
    tl.add(state, { scaleY: params.squashY, scaleXZ: params.squashXZ, ease: 'outQuad', duration: c.anticipateMs }, '<')
  } else {
    tl.add(state, { scaleY: params.squashY, scaleXZ: params.squashXZ, ease: 'outQuad', duration: c.anticipateMs })
  }
  tl
    // ascenso del arco de entrada (outQuad) hasta apex de entrada = top + jumpArc
    .add(state, { y: top + c.jumpArc + seat, x: (xPast + c.iLocalX) / 2, z: c.iLocalZ / 2,
                  scaleY: params.stretchY, scaleXZ: params.stretchXZ, ease: 'outQuad', duration: c.ascendMs })
    // 4b. PRIMER golpe = la caída (inQuad): el pie a top·D[0] y la I a D[0], MISMO tween.
    .add(state, { y: top * D[0] + seat, x: c.iLocalX, z: c.iLocalZ, scaleY: 0.92, scaleXZ: 1.05,
                  iScaleY: D[0], iScaleXZ: w(D[0]), ease: 'inQuad', duration: c.fallMs })

  // 5. GOLPES 2..5 (EL BOP LOOP — acá ocurre el "quieto en el aire"):
  const LAST = D.length - 1
  for (let i = 1; i <= LAST; i++) {
    const upMs = BASE_BOP_UP_MS[i] * c.bopSpeedScale
    const downMs = BASE_BOP_DOWN_MS[i] * c.bopSpeedScale
    const apex = top + BASE_BOP_HOP[i] * c.bopHopScale + seat
    const base = top * D[i - 1] + seat   // de dónde parte (golpe anterior)
    const land = top * D[i] + seat        // a dónde llega (hunde la I un poco más)

    // (A) SUBE con curva SENO: y = base + (apex-base)·sin(p·π/2). [v=0 en la cima ⇒ hang]
    //     La ESCALA del cuerpo va desincronizada por keyframes (estirón pico 1.2 a 60%).
    tl.add(state, {
      y: { from: 0, to: 1, ease: 'linear', duration: upMs,
           modifier: (p) => base + (apex - base) * Math.sin((p * Math.PI) / 2) },
      scaleY:  [{ to: 1.2,  duration: upMs * 0.6, ease: 'outQuad' }, { to: 1.04, duration: upMs * 0.4, ease: 'linear' }],
      scaleXZ: [{ to: 0.88, duration: upMs * 0.6, ease: 'outQuad' }, { to: 0.98, duration: upMs * 0.4, ease: 'linear' }],
      duration: upMs,
    })
    // La I REBOTA a su forma (jiggle elástico → 1), desfasada +20ms del up.
    tl.add(state, { iScaleY: 1, iScaleXZ: 1, ease: JIGGLE, duration: upMs }, '<+=20')
    // (A) CAE con curva COSENO: y = apex + (land-apex)·(1-cos(p·π/2)). [v=0 en la cima ⇒ hang]
    //     La escala (0.78) y el PRESS de la I (a D[i]) van en inQuad. Arranca en el apex.
    tl.add(state, {
      y: { from: 0, to: 1, ease: 'linear', duration: downMs,
           modifier: (p) => apex + (land - apex) * (1 - Math.cos((p * Math.PI) / 2)) },
      scaleY: 0.78, scaleXZ: 1.18, iScaleY: D[i], iScaleXZ: w(D[i]),
      ease: 'inQuad', duration: downMs,
    }, '<+=' + (upMs - 20))
  }

  // 6. La I queda APLASTADA (D[4]=0.02) con un temblequeo residual; el saltarín se asienta.
  tl.add(state, { y: top * D[LAST] + seat, scaleY: 1, scaleXZ: 1, ease: 'outQuad', duration: 360 })
  tl.add(state, { iScaleY: D[LAST] + 0.06, ease: 'outQuad', duration: 80 }, '<')
    .add(state, { iScaleY: D[LAST], ease: JIGGLE_SOFT, duration: 460 })

  // 7. (lámpara) Mira a la cámara: inclina la cabeza (headPitch → endHeadPitch).
  if (lookBeats) {
    tl.add(state, { headPitch: c.endHeadPitch, ease: 'inOutSine', duration: c.lookCamMs })
  }
  return tl
}
```

### Dónde EXACTAMENTE se queda quieta la lámpara

En cada vuelta del **bop loop (Paso 5)**: la lámpara sube con `sin` y cae con `cos`.
En la **cima** (fin del tween de subida / inicio del de caída) la **velocidad vertical
es 0** (`cos(π/2)=0` y `sin(0)=0`). Con `apex` alto (`top + 3.0 ≈ 4.4`) y `upMs≈360ms`,
ese instante de v=0 **dura lo suficiente para verse como que "flota/se queda quieta"**.
NO hay ningún `hang` explícito acá (a diferencia de `addHop`, que sí tiene un beat de
`hangMs`); el "quieto" es puramente el v=0 geométrico de la cima del arco.

> Para reproducir el efecto: la lámpara cruza, salta sobre la I, y en **cada uno de los
> golpes 2–5** sube ~4.4 unidades, **se frena un instante arriba**, y cae. Ese frenón es
> lo que el usuario quiere eliminar manteniendo que se vea natural (no robótico).

---

## 14. La "I" como parte del MISMO sistema (no corregir solo el salto)

> **Importante para el agente del browser:** el salto y la "I" son **un solo sistema
> acoplado**. Tocar el arco del saltarín cambia cómo se ve el aplaste, y viceversa. No
> conviene optimizar el salto aislado: hay que mirar **cómo el pie y el tope de la I
> coinciden (o no) frame a frame**.

### Geometría del contacto

- El **pie** del saltarín está en `y=0` local → su mundo = `state.y` (= `s.y`). El grupo
  se escala por `lampScale` pero el pie (y=0) no se levanta, así que **pie = `s.y`**.
- El **tope de la I** está en `top · iScaleY` (la I escala desde su base en `y=0`;
  `top` ≈ 1.4 medido del bbox). Aplastar = bajar `iScaleY`.
- **Para que "compongan" (el pie apoyado/presionando la I): `s.y` debe ser igual a
  `top · iScaleY` durante el contacto.** Si difieren, el pie flota sobre la I o la
  atraviesa. Ese es el criterio clave a vigilar.

### Ciclo de vida de la I (estado ACTUAL — versión con jiggle)

`deflate D = [0.8, 0.78, 0.76, 0.74, 0.02]` (scaleY de la I tras cada golpe).

1. **Entera** (`iScaleY = 1`) durante todo el cruce/miradas.
2. **1er golpe (Paso 4b, la caída del salto-encima):** el pie cae a `top·D[0]` y la I
   baja a `D[0]=0.8` **en el MISMO tween** (`inQuad`) → sincronizados.
3. **Golpes 2–5 (Paso 5), por cada bop `i`:**
   - **Subida:** la I hace **jiggle elástico** `iScaleY → 1` (`outElastic`, `'<+=20'`):
     **vuelve hacia su forma entera** mientras el pie sube.
   - **Caída:** el pie cae a `top·D[i]` y la I se hunde a `D[i]` en el mismo `inQuad`
     (sincronizados de nuevo).
   - → la I **rebota** entre ~1 (entera, al subir) y `D[i]` (presionada, al caer), cada
     vez a un `D[i]` más bajo. **NO** queda progresivamente comprimida: se recupera
     entre golpe y golpe.
4. **Final (Paso 6):** la I queda en `D[4]=0.02` (a ras del piso) con un **temblequeo
   residual** (`0.02 → 0.08 → 0.02`, `outElastic`).

### El punto de fricción del usuario (acoplado al salto)

El usuario tiene **dos pedidos que tironean entre sí** sobre la I:

- *"que la I no vuelva a entera entre golpes / se vea aplastada cuando debe"* → implica
  que la I **NO** se recupere a 1 con el jiggle, sino que quede comprimida en `D[i-1]` y
  sólo se hunda más (resistencia progresiva).
- *"no quiero el jiggle / que no rebote después de aplastar"* → sacar el `outElastic` de
  la recuperación y del residual.

Pero esos dos pedidos **chocan con el salto**: si la I sigue rígida al pie (no se
recupera), entonces durante la SUBIDA del bop el pie se despega y la I se queda abajo,
y la coincidencia pie↔I sólo ocurre en el último tramo de la caída.

### Lo que YA probamos y revertimos (para no repetir)

1. **Foot-follow** (`iScaleY = min(D[i-1], footY/top)`): la I seguía exactamente al pie
   y no se recuperaba a entera → **componía perfecto**, pero el usuario lo sintió "raro"
   (la I casi no se movía en los golpes 1–4 y el rebote/jiggle desaparecía). **Revertido.**
2. **Parábola de posición vía `modifier`** (un solo tween, `a` constante, sin doble-cero):
   arreglaba el "estático en la cima" ("cae bien ahora"), pero al combinarlo con el
   foot-follow la I quedó rara. **Revertido** a pedido del usuario.
3. **Estado actual** = se revirtió la parábola+foot-follow y luego se aplicó el cambio
   **(A)**: posición del bop con **curvas seno (subida) / coseno (caída)** vía `modifier`,
   manteniendo escala desincronizada + jiggle `'<+=20'` + press a `D[i]` + residual. El
   "estático en la cima" **PERSISTE** (ver §13: el v=0 de la cima es inherente al arco
   suave, no lo arregla cambiar la fórmula). Falta aplicar **(B)** (modelo de contacto
   de la I por `max(contacto, libre)`), que es ortogonal al hang.

> **Pista para el agente:** el problema NO es "el salto" ni "la I" por separado, sino su
> **acople**. Conviene decidir juntos: (a) ¿la I se recupera entre golpes (jiggle, se ve
> vivo pero "vuelve a entera") o queda comprimida resistiendo (compone mejor pero más
> rígida)?; y (b) ¿cómo es el arco del pie en la cima (parábola continua sin doble-cero
> vs. `outQuad`/`inQuad` con mini-hang)? La mejor solución probablemente combine la
> **parábola del pie** (caída fluida) con un **modelo de contacto** de la I que componga
> sin perder vida (p. ej. seguir al pie en el contacto + un overshoot SOLO al despegar).
