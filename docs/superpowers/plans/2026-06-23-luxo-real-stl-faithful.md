# Luxo "real" (fiel a STL) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruir la Luxo Jr. 100% procedural (Lathe/Extrude/CSG) copiando la forma real extraída de los STL, en una ruta aislada `/luxo-real`.

**Architecture:** Un extractor offline (Python, scratchpad) slicea cada STL y hornea perfiles/contornos relativos (base=1.0) a `src/luxoReal/profiles/*.ts`. Builders genéricos (`revolve`, `extrudeContour`) consumen esos datos; componentes R3F por pieza los renderizan; una galería los muestra sueltos. Runtime sin STL.

**Tech Stack:** React 19, @react-three/fiber 9, three 0.184, three-bvh-csg, leva, vitest + @react-three/test-renderer. Extractor: Python 3 (struct, sin numpy).

## Global Constraints

- STL **solo-lectura**, NO se importan al repo ni se cargan en runtime. Ruta: `/Users/gonzalomartinese/Downloads/luxo-jr-for-200x200mm-printer-with-led-light-model_files`.
- Unidad maestra: ancho del `foot` = **199.98 mm = 1.0**. Todo perfil va en unidades relativas (÷199.98).
- Aislamiento total: sólo se crea/edita bajo `src/luxoReal/` + la ruta en `src/App.tsx`. **NO** tocar `src/luxo/`, `src/scene/`, ni la escena PIXAR.
- Material: un solo `MeshStandardMaterial` gris (`#b9bbc1`, metalness 0.7, roughness 0.35), compartido y pasado por prop (patrón de `src/luxo/`).
- Tests: vitest. Componentes con `@react-three/test-renderer` mockeando `Environment`/`ContactShadows` de drei (patrón de `src/luxo/LuxoPlayground.test.tsx`).
- Comandos: test `npm test -- <ruta>`; lint `npm run lint`; build `npm run build`.
- **Git:** el proyecto NO es repo git. Los pasos "Commit" son opcionales (si usás git, `git init` una vez). Si no, salteálos.
- Features que un perfil de revolución no puede tener (vents, agujeros) se restan con **CSG**, con posiciones/Ø **medidos del STL** (no inventados), y se limpian triángulos degenerados (patrón de `src/luxo/geometry/headShadeGeometry.ts:dropDegenerateTriangles`).

---

### Task 1: Andamiaje de `/luxo-real`

**Files:**
- Create: `src/luxoReal/dimensions.ts`
- Create: `src/luxoReal/LuxoRealPlayground.tsx`
- Create: `src/luxoReal/LuxoRealGallery.tsx`
- Create: `src/luxoReal/LuxoRealPlayground.test.tsx`
- Modify: `src/App.tsx` (import + nav link + route)

**Interfaces:**
- Produces: `LuxoRealPlayground()` (Canvas), `LuxoRealGallery(props)` (grupo con material compartido, hoy vacío). `MASTER_MM = 199.98` y `BASE_DIAMETER = 1.0` en `dimensions.ts`.

- [ ] **Step 1: dimensions.ts independiente**

Crear `src/luxoReal/dimensions.ts`:

```ts
// Dimensiones de la Luxo "real" (fiel a STL). Unidad maestra: ancho del foot.
// Los perfiles en profiles/ ya vienen normalizados; acá van constantes globales
// y las medidas que se vayan necesitando por pieza.
export const MASTER_MM = 199.98 // ancho real del foot (mm) = 1.0
export const BASE_DIAMETER = 1.0 // unidad maestra
export const MATERIAL_COLOR = '#b9bbc1'
export const MATERIAL_METALNESS = 0.7
export const MATERIAL_ROUGHNESS = 0.35
```

- [ ] **Step 2: Galería vacía con material compartido**

Crear `src/luxoReal/LuxoRealGallery.tsx`:

```tsx
import { useEffect, useMemo } from 'react'
import { MeshStandardMaterial } from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { MATERIAL_COLOR, MATERIAL_METALNESS, MATERIAL_ROUGHNESS } from './dimensions'

// Galería de piezas SUELTAS de la Luxo fiel a STL. Material gris único compartido.
// Las piezas se agregan acá a medida que se construyen.
export function LuxoRealGallery(props: ThreeElements['group']) {
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: MATERIAL_COLOR,
        metalness: MATERIAL_METALNESS,
        roughness: MATERIAL_ROUGHNESS,
      }),
    [],
  )
  useEffect(() => () => material.dispose(), [material])

  return (
    <group {...props}>
      {/* Piezas fieles (foot, head, links, hinges, rods, LED...) se enchufan acá,
          cada una con material={material} y su position de galería. */}
      <mesh visible={false} material={material}>
        <boxGeometry args={[0.001, 0.001, 0.001]} />
      </mesh>
    </group>
  )
}
```

- [ ] **Step 3: Playground (Canvas, mismo color/luz que /luxo)**

Crear `src/luxoReal/LuxoRealPlayground.tsx`:

```tsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { LuxoRealGallery } from './LuxoRealGallery'

export function LuxoRealPlaygroundContent() {
  return (
    <>
      <color attach="background" args={['#64b5f6']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[6, 10, 6]} intensity={2.5} castShadow />
      <Environment preset="city" />
      <LuxoRealGallery />
      <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={20} blur={2.6} far={5} color="#143a63" />
      <OrbitControls makeDefault target={[0, 0.4, 0]} />
    </>
  )
}

export function LuxoRealPlayground() {
  return (
    <Canvas shadows camera={{ position: [0, 2, 6.5], fov: 50 }} style={{ width: '100vw', height: '100vh' }}>
      <LuxoRealPlaygroundContent />
    </Canvas>
  )
}
```

- [ ] **Step 4: Ruta en App.tsx**

En `src/App.tsx`: agregar `import { LuxoRealPlayground } from './luxoReal/LuxoRealPlayground'`; en `<nav>` un `<Link to="/luxo-real" style={{ color: '#fff' }}>Luxo real</Link>`; en `<Routes>` un `<Route path="/luxo-real" element={<LuxoRealPlayground />} />`. No tocar las rutas existentes.

- [ ] **Step 5: Test del playground**

Crear `src/luxoReal/LuxoRealPlayground.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { LuxoRealPlaygroundContent } from './LuxoRealPlayground'

vi.mock('@react-three/drei', async (importOriginal) => {
  const original = await importOriginal<typeof import('@react-three/drei')>()
  return { ...original, Environment: () => null, ContactShadows: () => null }
})

describe('LuxoRealPlaygroundContent', () => {
  it('monta la base de la escena (luz direccional) sin lanzar', async () => {
    const renderer = await ReactThreeTestRenderer.create(<LuxoRealPlaygroundContent />)
    expect(renderer.scene.findAllByType('DirectionalLight').length).toBeGreaterThan(0)
    await renderer.unmount()
  })
})
```

- [ ] **Step 6: Verificar**

Run: `npm test -- src/luxoReal/LuxoRealPlayground.test.tsx` → PASS. `npm run lint` → sin errores. `npm run build` → OK. Abrir `/luxo-real` (dev): escena azul vacía, `/luxo` intacto.

---

### Task 2: Pipeline de extracción + perfiles horneados (datos)

**Files:**
- Create (scratchpad, NO en repo): `<scratchpad>/stl_extract.py`
- Create: `src/luxoReal/profiles/_README.md` (documenta el origen de los datos)
- Deliverable: JSON de perfiles en scratchpad + tabla de clasificación reportada al controlador.

**Interfaces:**
- Produces: por cada STL, un registro `{piece, family: 'revolution'|'flat'|'complex', bbox_mm:[x,y,z], profile|contour|holes, n_points}` en unidades relativas (÷199.98). Este JSON es la fuente de los `profiles/*.ts` de las tareas siguientes.

- [ ] **Step 1: Extractor (clasifica + slicea)**

Crear `<scratchpad>/stl_extract.py` que, para cada `*.stl`:
1. Parsea STL binario (`struct`, sin numpy): header 80B + uint32 nº triángulos + 50B/triángulo (normal + 3 vértices + attr). Verifica `84+n*50==len`.
2. Calcula bbox y centro. Define eje de espesor = el de menor extensión.
3. **Clasifica:** `flat` si una dimensión ≪ las otras dos (ratio < ~0.3) y sección ~constante; `revolution` si X≈Y y radio ~constante por banda angular alrededor del centro XY; si no, `complex`.
4. **Revolución:** N bandas en Z; por banda, radio máx desde el centro → perfil `[(r,z)]` en relativo. Decima puntos casi colineales (tolerancia).
5. **Plana:** corta el plano medio (z=mid del eje de espesor); junta los segmentos de intersección triángulo-plano en loops cerrados → contorno exterior + agujeros, en relativo.
6. **Compleja:** emite la silueta proyectada al plano dominante + bbox; marca `family:'complex'`.
7. Vuelca todo a `<scratchpad>/luxo_profiles.json` y imprime tabla `pieza | familia | bbox mm | nº puntos`.

Run: `python3 <scratchpad>/stl_extract.py`
Expected: tabla con 23 piezas clasificadas; `luxo_profiles.json` escrito.

- [ ] **Step 2: Revisar clasificación + reportar**

Leer la tabla. Confirmar que: foot/head/neck/rods/spacer/cap/button/bulb/led_support → `revolution`; links/sections/box_sections/cable_hide → `flat`; hinges → `complex`. Anotar discrepancias (pieza mal clasificada) para tratarla en su familia. Reportar la tabla al controlador.

- [ ] **Step 3: Documentar origen de datos**

Crear `src/luxoReal/profiles/_README.md`:

```markdown
# Perfiles fieles a STL

Estos datos se EXTRAJERON una sola vez (offline) de los STL del modelo imprimible
con `stl_extract.py` (en el scratchpad de la sesión), sliceando cada malla.
Están en UNIDADES RELATIVAS (÷199.98 mm = ancho del foot = 1.0).
NO son la malla STL: son el perfil/contorno reproducido procedural.
Cada archivo `*Profile.ts` / `*Contour.ts` documenta su STL de origen y bbox real.
```

(No hay commit de datos crudos; sólo los `*.ts` horneados en las tareas siguientes.)

---

### Task 3: Builders genéricos (revolve / extrudeContour)

**Files:**
- Create: `src/luxoReal/geometry/revolve.ts`
- Create: `src/luxoReal/geometry/extrudeContour.ts`
- Test: `src/luxoReal/geometry/revolve.test.ts`, `src/luxoReal/geometry/extrudeContour.test.ts`

**Interfaces:**
- Produces:
  - `buildRevolution(profile: Vector2[], segments?: number): LatheGeometry` — revoluciona el perfil (x=radio, y=altura) alrededor de Y.
  - `buildExtruded(outer: Vector2[], holes: Vector2[][], depth: number): BufferGeometry` — Shape(outer) + holes → ExtrudeGeometry centrado en Z; agujeros del contorno.

- [ ] **Step 1: Test de revolve (falla)**

Crear `src/luxoReal/geometry/revolve.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { Vector2, Box3 } from 'three'
import { buildRevolution } from './revolve'

describe('buildRevolution', () => {
  it('revoluciona un perfil y respeta radio/alto', () => {
    const profile = [new Vector2(0, 0), new Vector2(0.5, 0), new Vector2(0.5, 1), new Vector2(0, 1)]
    const geo = buildRevolution(profile, 64)
    geo.computeBoundingBox()
    const b = geo.boundingBox as Box3
    expect(b.max.x - b.min.x).toBeCloseTo(1.0, 2) // Ø = 2·radio
    expect(b.max.y - b.min.y).toBeCloseTo(1.0, 2)
    geo.dispose()
  })
})
```

- [ ] **Step 2: Correr → FAIL** (`buildRevolution` no existe)

Run: `npm test -- src/luxoReal/geometry/revolve.test.ts` → FAIL.

- [ ] **Step 3: Implementar revolve.ts**

```ts
import { LatheGeometry, Vector2 } from 'three'

const DEFAULT_SEGMENTS = 96

// Revoluciona un perfil 2D (x=radio, y=altura) alrededor del eje Y. El perfil
// debe venir ordenado de abajo hacia arriba; puntos en x=0 cierran las tapas.
export function buildRevolution(profile: Vector2[], segments: number = DEFAULT_SEGMENTS): LatheGeometry {
  return new LatheGeometry(profile, segments)
}
```

- [ ] **Step 4: Correr → PASS**

- [ ] **Step 5: Test de extrudeContour (falla)**

Crear `src/luxoReal/geometry/extrudeContour.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { Vector2, Box3 } from 'three'
import { buildExtruded } from './extrudeContour'

describe('buildExtruded', () => {
  it('extruye un contorno con su espesor y conserva el bbox 2D', () => {
    const outer = [new Vector2(-0.5, -0.25), new Vector2(0.5, -0.25), new Vector2(0.5, 0.25), new Vector2(-0.5, 0.25)]
    const geo = buildExtruded(outer, [], 0.1)
    geo.computeBoundingBox()
    const b = geo.boundingBox as Box3
    expect(b.max.x - b.min.x).toBeCloseTo(1.0, 3)
    expect(b.max.y - b.min.y).toBeCloseTo(0.5, 3)
    expect(b.max.z - b.min.z).toBeCloseTo(0.1, 3) // espesor centrado
    geo.dispose()
  })
})
```

- [ ] **Step 6: Correr → FAIL**

- [ ] **Step 7: Implementar extrudeContour.ts**

```ts
import { BufferGeometry, ExtrudeGeometry, Path, Shape, Vector2 } from 'three'

// Construye una pieza plana: contorno exterior + agujeros, extruido `depth` en Z
// y centrado en Z. Contornos en el plano XY (unidades relativas).
export function buildExtruded(outer: Vector2[], holes: Vector2[][], depth: number): BufferGeometry {
  const shape = new Shape(outer)
  for (const h of holes) {
    const path = new Path(h)
    shape.holes.push(path)
  }
  const geo = new ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 24 })
  geo.translate(0, 0, -depth / 2)
  return geo
}
```

- [ ] **Step 8: Correr → PASS.** Luego `npm run lint` → OK.

---

### Task 4: Foot (revolución, pieza ancla)

**Files:**
- Create: `src/luxoReal/profiles/footProfile.ts` (datos horneados del extractor)
- Create: `src/luxoReal/parts/Foot.tsx`
- Test: `src/luxoReal/profiles/footProfile.test.ts`, `src/luxoReal/parts/Foot.test.tsx`
- Modify: `src/luxoReal/LuxoRealGallery.tsx` (montar `<Foot>`)

**Interfaces:**
- Consumes: `buildRevolution` (Task 3); `FOOT_PROFILE: Vector2[]` (horneado).
- Produces: `Foot({ material, ...props })` — malla de revolución de la base, apoyada en y=0.

- [ ] **Step 1: Hornear el perfil**

Crear `src/luxoReal/profiles/footProfile.ts` con el array `FOOT_PROFILE` = perfil de `foot_v1` que emitió el extractor (Task 2, `luxo_profiles.json`, pieza `foot_v1.stl`), como `Vector2[]` en relativo, ordenado de y=0 hacia arriba, con tapas en x=0. Comentar arriba: STL de origen, bbox real `200×200×125mm`, normalización ÷199.98.

```ts
import { Vector2 } from 'three'
// foot_v1.stl — bbox 199.97×199.98×125.15mm — normalizado ÷199.98 (base=1.0).
// Perfil de revolución (x=radio, y=altura) extraído por slicing.
export const FOOT_PROFILE: Vector2[] = [
  // ← pegar acá los pares (r,z) relativos del extractor para foot_v1
]
```

- [ ] **Step 2: Test del perfil (bbox vs STL real)**

Crear `src/luxoReal/profiles/footProfile.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { FOOT_PROFILE } from './footProfile'

describe('FOOT_PROFILE', () => {
  it('tiene radio máx ≈ 0.5 (Ø1.0) y alto ≈ 0.626 (real)', () => {
    const rMax = Math.max(...FOOT_PROFILE.map((p) => p.x))
    const zMax = Math.max(...FOOT_PROFILE.map((p) => p.y))
    const zMin = Math.min(...FOOT_PROFILE.map((p) => p.y))
    expect(rMax).toBeCloseTo(0.5, 2)
    expect(zMax - zMin).toBeCloseTo(0.626, 2) // 125.15/199.98
  })
  it('empieza y termina en el eje (tapas cerradas)', () => {
    expect(FOOT_PROFILE[0].x).toBeCloseTo(0, 2)
    expect(FOOT_PROFILE[FOOT_PROFILE.length - 1].x).toBeCloseTo(0, 2)
  })
})
```

- [ ] **Step 3: Correr → FAIL** (perfil vacío) → pegar datos → **PASS**.

Run: `npm test -- src/luxoReal/profiles/footProfile.test.ts`. Si falla por tapas, agregar puntos en x=0 al inicio/fin del perfil.

- [ ] **Step 4: Componente Foot**

Crear `src/luxoReal/parts/Foot.tsx`:

```tsx
import { useMemo, useEffect } from 'react'
import type { Material } from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { buildRevolution } from '../geometry/revolve'
import { FOOT_PROFILE } from '../profiles/footProfile'

// Base/pie de la Luxo, revolución del perfil real de foot_v1. Apoyada en y=0.
export function Foot({ material, ...props }: ThreeElements['group'] & { material: Material }) {
  const geometry = useMemo(() => buildRevolution(FOOT_PROFILE), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <group {...props}>
      <mesh geometry={geometry} material={material} castShadow receiveShadow />
    </group>
  )
}
```

- [ ] **Step 5: Test del componente**

Crear `src/luxoReal/parts/Foot.test.tsx` (patrón test-renderer): monta `<Foot material={new MeshStandardMaterial()} />`, espera ≥1 `Mesh`, unmount sin lanzar.

- [ ] **Step 6: Montar en galería + verificar**

En `LuxoRealGallery.tsx` reemplazar el placeholder por `<Foot material={material} position={[0, 0, 0]} />`.
Run: `npm test -- src/luxoReal` → PASS. `npm run build` → OK. `/luxo-real` muestra la base fiel.
Verificación de forma (scratchpad): script que revoluciona `FOOT_PROFILE` y compara bbox con `foot_v1` real (≤2% error).

---

### Task 5: Cabeza + cuello + reflector + tapa-cables

**Files:**
- Create: `src/luxoReal/profiles/headProfile.ts`, `headNeckProfile.ts`, `reflectorProfile.ts`, `cableHideContour.ts`
- Create: `src/luxoReal/geometry/headVents.ts` (CSG de vents sobre la revolución)
- Create: `src/luxoReal/parts/Head.tsx`, `HeadNeck.tsx`, `CableHide.tsx`
- Test: perfiles + `Head.test.tsx`
- Modify: `LuxoRealGallery.tsx`

**Interfaces:**
- Consumes: `buildRevolution`, `buildExtruded`, `HEAD_PROFILE`, etc.
- Produces: `Head`, `HeadNeck`, `CableHide` (cada uno `{material, ...props}`). `buildHeadGeometry(): BufferGeometry` (revolución + vents CSG, con limpieza de degenerados).

- [ ] **Step 1: Hornear perfiles** de head/neck/reflector (revolución) y cable_hide (contorno plano) desde el extractor, con sus tests de bbox (mismo patrón que footProfile.test): head bbox `154.9×154.9×129.2` → Ø 0.775, alto 0.646; neck `12×28.9×35.2`; cable_hide Ø≈0.229, espesor 0.01.

- [ ] **Step 2: Medir vents del STL real**

En el extractor (o script aparte), detectar las ranuras de la cabeza: contar slots, su altura (z) y bolt-circle, sobre `head_v1`. Anotar `VENT_COUNT`, `VENT_CENTER_Y_REL`, `VENT_BC_REL`, largo/ancho relativos. (Si no se detectan limpio, usar los del blueprint L-LH-001 y marcarlo.)

- [ ] **Step 3: headVents.ts (revolución + CSG vents)**

```ts
import { BufferGeometry, BoxGeometry, Matrix4, Vector3 } from 'three'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg'
import { buildRevolution } from './revolve'
import { HEAD_PROFILE } from '../profiles/headProfile'
// Reusar dropDegenerateTriangles (copiar el helper de src/luxo/geometry/headShadeGeometry.ts).
// Construye la cabeza: revolución del perfil real + N vents pasantes (medidos),
// perpendiculares a la pared, equiespaciados; limpia triángulos degenerados.
export function buildHeadGeometry(): BufferGeometry { /* ... ver headShadeGeometry para el patrón de vents + cleanup ... */ }
```

Implementar siguiendo el patrón ya probado en `src/luxo/geometry/headShadeGeometry.ts` (orientación de cada box con `makeBasis`, `evaluate(..., SUBTRACTION)`, dispose de intermedias, `dropDegenerateTriangles`), pero la base es `buildRevolution(HEAD_PROFILE)` y las posiciones/cantidad de vents son las **medidas** del STL.

- [ ] **Step 4: Componentes** Head (usa `buildHeadGeometry`), HeadNeck (revolución), CableHide (extrude). Reflector: cono `openEnded` desde `REFLECTOR_PROFILE` con material DoubleSide clonado (patrón de `src/luxo/parts/LampHead.tsx`).

- [ ] **Step 5: Tests** (perfiles bbox + componentes montan ≥ N mallas) y **verificación CSG** de vents por raycast + 0 degenerados (patrón de la cabeza actual).

- [ ] **Step 6: Montar en galería + build OK.**

---

### Task 6: Links / sections (planas, contorno real + agujeros)

**Files:**
- Create: `src/luxoReal/profiles/linkContour.ts`, `linkFrontContour.ts`, `linkBackContour.ts`, `sectionContour.ts`, `boxSectionsContour.ts`
- Create: `src/luxoReal/parts/Link.tsx`, `Section.tsx`, `BoxSections.tsx`
- Test: perfiles + componentes
- Modify: `LuxoRealGallery.tsx`

**Interfaces:**
- Consumes: `buildExtruded(outer, holes, depth)`. Cada contorno horneado: `{ OUTER: Vector2[], HOLES: Vector2[][], DEPTH: number }`.
- Produces: `Link`, `Section`, `BoxSections` (`{material, ...props}`).

- [ ] **Step 1:** Hornear contornos (exterior + agujeros) de cada plana desde el extractor (corte plano-medio). Test de bbox 2D vs STL (ej. link_front `14×87.6×12` → 0.07×0.438×0.06; verificar nº de agujeros = 2).
- [ ] **Step 2:** Componentes que hacen `useMemo(() => buildExtruded(OUTER, HOLES, DEPTH))` + mesh con material por prop + dispose.
- [ ] **Step 3:** Tests de componente (montan ≥1 Mesh) y **verificación de agujero** por raycast (centro pasa, macizo choca). Si el slicing no capturó agujeros, fallback: restar cilindros CSG con el Ø medido y re-test.
- [ ] **Step 4:** Montar en galería + build OK.

---

### Task 7: Pivotería (rods, spacer, cap, button — revoluciones chicas)

**Files:**
- Create: `src/luxoReal/profiles/{rod,rodSpacer,rodCap,rodButton}Profile.ts`
- Create: `src/luxoReal/parts/Rod.tsx`, `RodSpacer.tsx`, `RodCap.tsx`, `RodButton.tsx`
- Test: perfiles + un test de componente representativo
- Modify: `LuxoRealGallery.tsx`

**Interfaces:**
- Consumes: `buildRevolution`. Produces: 4 componentes `{material, ...props}`.

- [ ] **Step 1:** Hornear perfiles de revolución de `rods` (Ø0.060, largo 0.224), `rod_spacer` (Ø0.042), `rod_cap` (Ø0.041), `rod_head_button` (Ø0.060), con tests de bbox.
- [ ] **Step 2:** Componentes (revolución; el eje del rod va a lo largo de Z → el grupo se rota `rotation={[Math.PI/2,0,0]}` para acostarlo si hace falta para la galería).
- [ ] **Step 3:** Tests + montar en galería + build OK.

---

### Task 8: Hinges (complejas, best-effort)

**Files:**
- Create: `src/luxoReal/profiles/hinge{Bottom,Middle,Top}Contour.ts`
- Create: `src/luxoReal/parts/Hinge.tsx` (parametrizado por nivel) o `HingeBottom/Middle/Top.tsx`
- Test: perfiles + componente
- Modify: `LuxoRealGallery.tsx`

**Interfaces:**
- Consumes: `buildExtruded` (silueta dominante) + CSG para agujeros de eje.
- Produces: componentes de hinge por nivel `{material, ...props}`.

- [ ] **Step 1:** Hornear la **silueta proyectada** de cada hinge (vista principal) + agujeros, desde el extractor (`family:'complex'`). Test de bbox vs STL (bottom `74×33×15.7`, middle `75×51×5`, top `60×48×18`).
- [ ] **Step 2:** Componente: extrude de la silueta con su espesor + agujeros (CSG con Ø de pin medido). **Comentar el límite de fidelidad** (la forma 3D real puede tener detalles que la extrusión de silueta no captura).
- [ ] **Step 3:** Tests + montar en galería + build OK. Reportar al usuario qué tan fiel quedó cada hinge y ofrecer refinar.

---

### Task 9: LED (bulbo + soporte)

**Files:**
- Create: `src/luxoReal/profiles/bulbProfile.ts`, `ledSupportProfile.ts`
- Create: `src/luxoReal/parts/Bulb.tsx`, `LedSupport.tsx`
- Test: perfiles + componentes
- Modify: `LuxoRealGallery.tsx`

**Interfaces:**
- Consumes: `buildRevolution`. Produces: `Bulb`, `LedSupport` (`{material, ...props}`).

- [ ] **Step 1:** Hornear perfiles de revolución de `buble_light` (Ø0.30, alto 0.48) y `led_support` (Ø~0.10, alto 0.475), con tests de bbox.
- [ ] **Step 2:** Componentes (el bulbo puede usar un material propio más claro/emisivo si se ve mejor; por defecto el gris compartido). Tests.
- [ ] **Step 3:** Montar en galería + build OK.

---

### Task 10: Galería completa + verificación final

**Files:**
- Modify: `src/luxoReal/LuxoRealGallery.tsx` (layout final de todas las piezas)
- Modify: `src/luxoReal/LuxoRealPlayground.tsx` (cámara/encuadre final)

**Interfaces:** Consume todas las piezas. Produces: galería completa.

- [ ] **Step 1:** Acomodar todas las piezas en filas (revoluciones / planas / pivotería / hinges / LED), espaciadas y elevadas para verlas. Ajustar cámara/target para encuadrar la fila.
- [ ] **Step 2:** Suite completa `npm test` → PASS; `npm run lint` → 0; `npm run build` → OK.
- [ ] **Step 3:** Verificación de forma final (scratchpad): por cada pieza, bbox de la geometría procedural vs bbox del STL real ≤ ~2-3% error; reportar tabla. Marcar las que no cierren (esp. hinges).
- [ ] **Step 4:** Verificación visual: `npm run dev` → `/luxo-real` muestra todas las piezas fieles; `/luxo` sigue intacto.

---

## Notas de verificación (self-review)

- **Cobertura del spec:** aislamiento (`/luxo-real` + `src/luxoReal/`, Task 1); extractor slice & hornear (Task 2); builders revolución/extrude (Task 3); revolución (Tasks 4,5,7,9); planas (Task 6); complejas/hinges (Task 8); features CSG con datos reales (Task 5 vents, Task 6/8 agujeros); LED (Task 9); galería suelta (Tasks 1,10); testing bbox + CSG raycast (todas). `dimensions.ts` propio (Task 1). No tocar `/luxo` (Global Constraints).
- **Datos vs código:** los perfiles exactos provienen del extractor (Task 2) y se hornean en cada tarea; el código de builders/componentes es concreto y reutilizable (DRY: `buildRevolution`/`buildExtruded`). Esto es un pipeline de datos, no placeholders.
- **Consistencia de tipos:** `buildRevolution(Vector2[], segments?)`, `buildExtruded(outer, holes, depth)`, perfiles como `Vector2[]`, componentes `({material, ...props})` — usados igual en todas las tareas.
- **Git:** proyecto sin git → pasos de commit opcionales.
