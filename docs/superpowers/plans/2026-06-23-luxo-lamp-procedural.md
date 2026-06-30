# Lámpara Luxo procedural (primitivas + CSG) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir proceduralmente la lámpara Luxo con primitivas + CSG en una escena propia bajo `/lamp`, sin tocar la escena actual (texto "PIXAR").

**Architecture:** Builders de geometría puros (uno por pieza) que corren CSG con `three-bvh-csg` dentro de `useMemo`, consumidos por componentes-parte (`Base`, `Arm`, `Head`, `Spring`). `Lamp.tsx` ensambla una jerarquía de `<group>` anidados (joints) con refs nombrados y pose de reposo. `LampScene.tsx` monta el Canvas + Leva. `react-router-dom` añade `/lamp` dejando `/` intacta.

**Tech Stack:** React 19, TS estricto, three@0.184, @react-three/fiber@9, @react-three/drei@10, leva@0.10, three-bvh-csg@^0.0.18, three-mesh-bvh@^0.9.7, react-router-dom, vitest + @react-three/test-renderer.

## Global Constraints

- TS estricto, ESM con imports nombrados, componentes funcionales. No romper `npm run lint`, `npm run build`, `npm run test`.
- three@0.184 (peer de three-bvh-csg `>=0.179`). three-mesh-bvh `>=0.9.7`.
- **Todo el CSG corre dentro de `useMemo`** (una sola vez por instancia), nunca por frame.
- **Reusar geometrías repetidas**: una geometría de brazo por longitud reusada en su par (×2); una geometría de capsule reusada.
- Unidades relativas: base dome Ø = 1.0.
- Medidas (de `constants.ts`, fuente única):
  - Base (Weighted Dome): Ø 1.0, **H total 0.2** (perfil `LatheGeometry` redondeado).
  - Base neck: cilindro Ø 0.2 × H 0.15.
  - Lower arm: box 2.0 × 0.2 × 0.05, ×2, separación Z 0.12.
  - Upper arm: box 1.8 × 0.2 × 0.05, ×2, separación Z 0.12.
  - Central pivot block (elbow): 0.3 × 0.3 × 0.2.
  - Head pivot: cilindro Ø 0.15. Hueco de pivote (CSG): Ø **0.155** (0.15 + 0.005 clearance).
  - Spring: hélice coils 12, wire Ø 0.02, Ø 0.15, **Length 0.6**. **UNA sola**, decorativa, solo en lower arm.
  - Lamp head frustum: cono truncado Ø 0.8 (boca, abajo) → Ø 0.4 (arriba, taper asumido), H 0.7, pared 0.025; **12** vent slots 0.1 × 0.02.
  - Inner reflector: cono truncado Ø 0.75 → Ø 0.65 nominal, pared 0.05, dentro de la cabeza.
- CSG lib: `three-bvh-csg` imperativo (`Evaluator`/`Brush`/`SUBTRACTION`).
- Ruta nueva `/lamp`; la escena actual (`Scene`, `PixarText`, `SquashControls`) queda idéntica.
- `vitest.config.ts` debe incluir `three-bvh-csg` y `three-mesh-bvh` en `dedupe` e `inline`.
- **Assumption documentada:** el radio superior del frustum (Ø0.4) y la altura/radio del reflector son aproximaciones del blueprint (no cotadas exactamente); viven en `constants.ts` y se afinan a ojo.
- No hay git en el proyecto: **sin pasos de commit**.

---

### Task 1: Instalar dependencias + configurar vitest para CSG

**Files:**
- Modify: `package.json` (vía npm)
- Modify: `vitest.config.ts`
- Test: `src/lamp/csgSmoke.test.ts` (se borra al final del task)

**Interfaces:**
- Produces: `three-bvh-csg`, `three-mesh-bvh`, `react-router-dom` instalados; vitest deduplica/inline-a las libs CSG.

- [ ] **Step 1: Instalar deps**

```bash
cd /Users/gonzalomartinese/pixar-lamp
npm install three-bvh-csg@^0.0.18 three-mesh-bvh@^0.9.7 react-router-dom
```

- [ ] **Step 2: Actualizar `vitest.config.ts`** — añadir las libs CSG a `dedupe` e `inline`:

En `resolve.dedupe`, dejar:
```ts
    dedupe: ['three', 'three-bvh-csg', 'three-mesh-bvh'],
```
En `test.server.deps.inline`, dejar:
```ts
        inline: ['animejs', '@react-three/fiber', '@react-three/test-renderer', 'three', 'three-bvh-csg', 'three-mesh-bvh'],
```

- [ ] **Step 3: Escribir un smoke test de CSG** `src/lamp/csgSmoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { BoxGeometry } from 'three'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg'

describe('three-bvh-csg smoke', () => {
  it('resta dos brushes y produce geometría no vacía', () => {
    const evaluator = new Evaluator()
    evaluator.attributes = ['position', 'normal']
    const a = new Brush(new BoxGeometry(1, 1, 1))
    a.updateMatrixWorld()
    const b = new Brush(new BoxGeometry(0.5, 0.5, 2))
    b.updateMatrixWorld()
    const result = evaluator.evaluate(a, b, SUBTRACTION)
    expect(result.geometry.attributes.position.count).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 4: Ejecutar el smoke test (verde)**

Run: `npx vitest run src/lamp/csgSmoke.test.ts`
Expected: PASS (confirma que la versión de three-bvh-csg corre con three 0.184 bajo jsdom).

- [ ] **Step 5: Verificar typecheck y suite existente**

Run: `npx tsc -b`
Expected: exit 0.
Run: `npm run test`
Expected: todos PASS (la escena actual sigue verde).

- [ ] **Step 6: Borrar el smoke test**

```bash
rm src/lamp/csgSmoke.test.ts
```
(Su única función era validar el entorno CSG; el CSG real se testea por pieza.)

---

### Task 2: `constants.ts` — medidas del blueprint

**Files:**
- Create: `src/lamp/constants.ts`
- Test: `src/lamp/constants.test.ts`

**Interfaces:**
- Produces: objeto `LAMP` con todas las medidas. Claves exactas usadas por tasks siguientes:
  `base{diameter,height}`, `neck{diameter,height}`, `lowerArm{length,width,thickness}`, `upperArm{length,width,thickness}`, `armPairGapZ`, `pivotBlock{x,y,z}`, `headPivot{diameter}`, `pivotHole{diameter}`, `spring{coils,wireDiameter,diameter,length}`, `head{outerBottomR,outerTopR,height,wall,ventCount,ventW,ventH}`, `reflector{bottomR,topR,height,wall}`, `bulb{radius}`, `capsule{radius,length}`.

- [ ] **Step 1: Escribir el test que falla** `src/lamp/constants.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { LAMP } from './constants'

describe('LAMP constants', () => {
  it('refleja las medidas confirmadas del blueprint', () => {
    expect(LAMP.base.diameter).toBe(1.0)
    expect(LAMP.base.height).toBe(0.2)
    expect(LAMP.lowerArm.length).toBe(2.0)
    expect(LAMP.upperArm.length).toBe(1.8)
    expect(LAMP.armPairGapZ).toBe(0.12)
    expect(LAMP.pivotBlock).toEqual({ x: 0.3, y: 0.3, z: 0.2 })
    expect(LAMP.pivotHole.diameter).toBeCloseTo(0.155)
    expect(LAMP.spring).toMatchObject({ coils: 12, length: 0.6 })
    expect(LAMP.head.ventCount).toBe(12)
  })
})
```

- [ ] **Step 2: Ejecutar (rojo)**

Run: `npx vitest run src/lamp/constants.test.ts`
Expected: FAIL (no existe `constants.ts`).

- [ ] **Step 3: Crear `src/lamp/constants.ts`**

```ts
// Fuente única de medidas del blueprint Luxo (unidades relativas, base Ø=1.0).
// Valores confirmados con el usuario; los marcados "(aprox.)" no están cotados
// en el plano y se afinan visualmente.
export const LAMP = {
  base: { diameter: 1.0, height: 0.2 }, // perfil Lathe redondeado
  neck: { diameter: 0.2, height: 0.15 },
  lowerArm: { length: 2.0, width: 0.2, thickness: 0.05 },
  upperArm: { length: 1.8, width: 0.2, thickness: 0.05 },
  armPairGapZ: 0.12, // separación entre los 2 boxes del par (eje Z)
  pivotBlock: { x: 0.3, y: 0.3, z: 0.2 }, // central pivot block (elbow)
  headPivot: { diameter: 0.15 },
  pivotHole: { diameter: 0.155 }, // 0.15 + 0.005 clearance para el CSG
  spring: { coils: 12, wireDiameter: 0.02, diameter: 0.15, length: 0.6 },
  head: {
    outerBottomR: 0.4, // Ø0.8 boca (abajo)
    outerTopR: 0.2, // (aprox.) extremo angosto del cono
    height: 0.7,
    wall: 0.025,
    ventCount: 12,
    ventW: 0.1,
    ventH: 0.02,
  },
  reflector: {
    bottomR: 0.375, // Ø0.75
    topR: 0.19, // (aprox.) dentro de la cabeza
    height: 0.6, // (aprox.)
    wall: 0.05, // Ø0.75 - Ø0.65
  },
  bulb: { radius: 0.12 },
  capsule: { radius: 0.03, length: 0.16 },
} as const
```

- [ ] **Step 4: Ejecutar (verde)**

Run: `npx vitest run src/lamp/constants.test.ts`
Expected: PASS.

---

### Task 3: Base — `baseGeometry.ts` + `parts/Base.tsx`

**Files:**
- Create: `src/lamp/geometry/baseGeometry.ts`
- Create: `src/lamp/parts/Base.tsx`
- Test: `src/lamp/geometry/baseGeometry.test.ts`, `src/lamp/parts/Base.test.tsx`

**Interfaces:**
- Consumes: `LAMP` de `../constants`.
- Produces:
  - `buildBaseDomeGeometry(): LatheGeometry` — domo bajo y ancho, Ø≈1.0, alto≈0.2, centrado en X/Z con base en y=0.
  - `Base(props: ThreeElements['group']): JSX.Element` — domo (lathe) + neck (cilindro) apilados; el tope del neck en y = base.height + neck.height.

- [ ] **Step 1: Test del builder (rojo)** `src/lamp/geometry/baseGeometry.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildBaseDomeGeometry } from './baseGeometry'

describe('buildBaseDomeGeometry', () => {
  it('produce un domo Ø≈1.0 y altura≈0.2 apoyado en y=0', () => {
    const geo = buildBaseDomeGeometry()
    geo.computeBoundingBox()
    const bb = geo.boundingBox!
    expect(bb.max.x - bb.min.x).toBeCloseTo(1.0, 1)
    expect(bb.min.y).toBeCloseTo(0, 2)
    expect(bb.max.y).toBeCloseTo(0.2, 1)
    expect(geo.attributes.position.count).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Ejecutar (rojo)**

Run: `npx vitest run src/lamp/geometry/baseGeometry.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar `src/lamp/geometry/baseGeometry.ts`**

```ts
import { LatheGeometry, Vector2 } from 'three'
import { LAMP } from '../constants'

// Domo "weighted base": perfil 2D revolucionado. Redondeo del borde aproxima el
// fillet (sin booleano). Ø total = base.diameter, alto total = base.height.
export function buildBaseDomeGeometry(): LatheGeometry {
  const r = LAMP.base.diameter / 2 // 0.5
  const h = LAMP.base.height // 0.2
  const fillet = 0.05
  // Perfil desde el centro (x=0) hacia el borde, de abajo hacia arriba.
  const points = [
    new Vector2(0, 0),
    new Vector2(r - fillet, 0),
    new Vector2(r, fillet), // borde redondeado
    new Vector2(r * 0.85, h * 0.55),
    new Vector2(r * 0.5, h * 0.9),
    new Vector2(0, h), // cúspide del domo
  ]
  return new LatheGeometry(points, 48)
}
```

- [ ] **Step 4: Ejecutar (verde)**

Run: `npx vitest run src/lamp/geometry/baseGeometry.test.ts`
Expected: PASS.

- [ ] **Step 5: Smoke test de la parte (rojo)** `src/lamp/parts/Base.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { Base } from './Base'

describe('Base', () => {
  it('monta domo + neck (2 meshes) y se desmonta sin lanzar', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Base />)
    expect(renderer.scene.findAllByType('Mesh').length).toBe(2)
    await renderer.unmount()
  })
})
```

- [ ] **Step 6: Ejecutar (rojo)**

Run: `npx vitest run src/lamp/parts/Base.test.tsx`
Expected: FAIL.

- [ ] **Step 7: Implementar `src/lamp/parts/Base.tsx`**

```tsx
import { useMemo } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { buildBaseDomeGeometry } from '../geometry/baseGeometry'
import { LAMP } from '../constants'

export function Base(props: ThreeElements['group']) {
  const dome = useMemo(() => buildBaseDomeGeometry(), [])
  return (
    <group {...props}>
      <mesh geometry={dome} castShadow receiveShadow>
        <meshStandardMaterial color="#2b2b30" roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[0, LAMP.base.height + LAMP.neck.height / 2, 0]} castShadow>
        <cylinderGeometry args={[LAMP.neck.diameter / 2, LAMP.neck.diameter / 2, LAMP.neck.height, 24]} />
        <meshStandardMaterial color="#3a3a40" roughness={0.4} metalness={0.3} />
      </mesh>
    </group>
  )
}
```

- [ ] **Step 8: Ejecutar (verde) + typecheck**

Run: `npx vitest run src/lamp/parts/Base.test.tsx`
Expected: PASS.
Run: `npx tsc -b`
Expected: exit 0.

---

### Task 4: Spring — `springGeometry.ts` + `parts/Spring.tsx`

**Files:**
- Create: `src/lamp/geometry/springGeometry.ts`
- Create: `src/lamp/parts/Spring.tsx`
- Test: `src/lamp/geometry/springGeometry.test.ts`, `src/lamp/parts/Spring.test.tsx`

**Interfaces:**
- Consumes: `LAMP`.
- Produces:
  - `buildSpringGeometry(): TubeGeometry` — hélice a lo largo de Y, alto = spring.length, Ø de la hélice = spring.diameter, radio de tubo = spring.wireDiameter/2.
  - `Spring(props: ThreeElements['group']): JSX.Element`.

- [ ] **Step 1: Test del builder (rojo)** `src/lamp/geometry/springGeometry.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildSpringGeometry } from './springGeometry'

describe('buildSpringGeometry', () => {
  it('produce una hélice de altura≈0.6 y Ø≈0.15 no vacía', () => {
    const geo = buildSpringGeometry()
    geo.computeBoundingBox()
    const bb = geo.boundingBox!
    expect(bb.max.y - bb.min.y).toBeCloseTo(0.6, 1)
    expect(bb.max.x - bb.min.x).toBeCloseTo(0.15 + 0.02, 1) // Ø hélice + grosor del tubo
    expect(geo.attributes.position.count).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Ejecutar (rojo)**

Run: `npx vitest run src/lamp/geometry/springGeometry.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar `src/lamp/geometry/springGeometry.ts`**

```ts
import { CatmullRomCurve3, TubeGeometry, Vector3 } from 'three'
import { LAMP } from '../constants'

// Hélice muestreada como curva y revestida con TubeGeometry.
export function buildSpringGeometry(): TubeGeometry {
  const { coils, wireDiameter, diameter, length } = LAMP.spring
  const radius = diameter / 2
  const samplesPerCoil = 16
  const total = coils * samplesPerCoil
  const points: Vector3[] = []
  for (let i = 0; i <= total; i++) {
    const t = i / total
    const angle = t * coils * Math.PI * 2
    points.push(new Vector3(Math.cos(angle) * radius, t * length, Math.sin(angle) * radius))
  }
  const curve = new CatmullRomCurve3(points)
  return new TubeGeometry(curve, total, wireDiameter / 2, 8, false)
}
```

- [ ] **Step 4: Ejecutar (verde)**

Run: `npx vitest run src/lamp/geometry/springGeometry.test.ts`
Expected: PASS.

- [ ] **Step 5: Smoke test de la parte (rojo)** `src/lamp/parts/Spring.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { Spring } from './Spring'

describe('Spring', () => {
  it('monta un mesh y se desmonta sin lanzar', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Spring />)
    expect(renderer.scene.findAllByType('Mesh').length).toBe(1)
    await renderer.unmount()
  })
})
```

- [ ] **Step 6: Ejecutar (rojo)**

Run: `npx vitest run src/lamp/parts/Spring.test.tsx`
Expected: FAIL.

- [ ] **Step 7: Implementar `src/lamp/parts/Spring.tsx`**

```tsx
import { useMemo } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { buildSpringGeometry } from '../geometry/springGeometry'

export function Spring(props: ThreeElements['group']) {
  const geo = useMemo(() => buildSpringGeometry(), [])
  return (
    <group {...props}>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial color="#8a8a90" roughness={0.3} metalness={0.7} />
      </mesh>
    </group>
  )
}
```

- [ ] **Step 8: Ejecutar (verde) + typecheck**

Run: `npx vitest run src/lamp/parts/Spring.test.tsx`
Expected: PASS.
Run: `npx tsc -b`
Expected: exit 0.

---

### Task 5: Arm — `armGeometry.ts` (CSG) + `parts/Arm.tsx`

**Files:**
- Create: `src/lamp/geometry/armGeometry.ts`
- Create: `src/lamp/parts/Arm.tsx`
- Test: `src/lamp/geometry/armGeometry.test.ts`, `src/lamp/parts/Arm.test.tsx`

**Interfaces:**
- Consumes: `LAMP`, `three-bvh-csg`.
- Produces:
  - `buildArmGeometry(length: number): BufferGeometry` — box `length × width × thickness` con dos huecos de pivote (Ø `pivotHole.diameter`) cerca de cada extremo, atravesando el espesor (eje Z). Box centrado en su longitud (X).
  - `Arm(props: { length: number } & ThreeElements['group']): JSX.Element` — renderiza el **par** (2 meshes con la MISMA geometría, separados ±armPairGapZ/2 en Z).

- [ ] **Step 1: Test del builder (rojo)** `src/lamp/geometry/armGeometry.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { BoxGeometry } from 'three'
import { buildArmGeometry } from './armGeometry'

describe('buildArmGeometry', () => {
  it('produce un brazo de longitud≈L con huecos (geometría no vacía)', () => {
    const geo = buildArmGeometry(2.0)
    geo.computeBoundingBox()
    const bb = geo.boundingBox!
    expect(bb.max.x - bb.min.x).toBeCloseTo(2.0, 1)
    expect(geo.attributes.position.count).toBeGreaterThan(0)
  })

  it('tiene más triángulos que un box liso (los huecos agregan geometría)', () => {
    const plain = new BoxGeometry(2.0, 0.2, 0.05)
    const arm = buildArmGeometry(2.0)
    expect(arm.attributes.position.count).toBeGreaterThan(plain.attributes.position.count)
  })
})
```

- [ ] **Step 2: Ejecutar (rojo)**

Run: `npx vitest run src/lamp/geometry/armGeometry.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar `src/lamp/geometry/armGeometry.ts`**

```ts
import { BoxGeometry, BufferGeometry, CylinderGeometry } from 'three'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg'
import { LAMP } from '../constants'

// Box del brazo con dos huecos de pivote (uno cerca de cada extremo) atravesando
// el espesor. CSG corre una vez por llamada; el llamador la memoiza.
export function buildArmGeometry(length: number): BufferGeometry {
  const { width, thickness } = LAMP.lowerArm // width/thickness comunes a ambos brazos
  const holeR = LAMP.pivotHole.diameter / 2
  const margin = 0.12 // distancia del centro del hueco al extremo

  const evaluator = new Evaluator()
  evaluator.attributes = ['position', 'normal']

  const box = new Brush(new BoxGeometry(length, width, thickness))
  box.updateMatrixWorld()

  let result = box
  for (const sign of [-1, 1]) {
    // Cilindro orientado a lo largo de Z (atraviesa el espesor).
    const cyl = new CylinderGeometry(holeR, holeR, thickness + 0.05, 20)
    const hole = new Brush(cyl)
    hole.rotation.x = Math.PI / 2
    hole.position.set(sign * (length / 2 - margin), 0, 0)
    hole.updateMatrixWorld()
    result = evaluator.evaluate(result, hole, SUBTRACTION)
  }
  return result.geometry
}
```

- [ ] **Step 4: Ejecutar (verde)**

Run: `npx vitest run src/lamp/geometry/armGeometry.test.ts`
Expected: PASS.

- [ ] **Step 5: Smoke test de la parte (rojo)** `src/lamp/parts/Arm.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { Arm } from './Arm'

describe('Arm', () => {
  it('renderiza el par (2 meshes con geometría compartida) sin lanzar', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Arm length={2.0} />)
    const meshes = renderer.scene.findAllByType('Mesh')
    expect(meshes.length).toBe(2)
    await renderer.unmount()
  })
})
```

- [ ] **Step 6: Ejecutar (rojo)**

Run: `npx vitest run src/lamp/parts/Arm.test.tsx`
Expected: FAIL.

- [ ] **Step 7: Implementar `src/lamp/parts/Arm.tsx`**

```tsx
import { useMemo } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { buildArmGeometry } from '../geometry/armGeometry'
import { LAMP } from '../constants'

type Props = { length: number } & ThreeElements['group']

// El par comparte UNA geometría (reuso), instanciada en dos meshes separados en Z.
export function Arm({ length, ...props }: Props) {
  const geo = useMemo(() => buildArmGeometry(length), [length])
  const half = LAMP.armPairGapZ / 2
  return (
    <group {...props}>
      {[-half, half].map((z) => (
        <mesh key={z} geometry={geo} position={[0, 0, z]} castShadow receiveShadow>
          <meshStandardMaterial color="#4a4a52" roughness={0.4} metalness={0.4} />
        </mesh>
      ))}
    </group>
  )
}
```

- [ ] **Step 8: Ejecutar (verde) + typecheck**

Run: `npx vitest run src/lamp/parts/Arm.test.tsx`
Expected: PASS.
Run: `npx tsc -b`
Expected: exit 0.

---

### Task 6: Head — `headGeometry.ts` + `reflectorGeometry.ts` (CSG) + `parts/Head.tsx`

**Files:**
- Create: `src/lamp/geometry/headGeometry.ts`, `src/lamp/geometry/reflectorGeometry.ts`
- Create: `src/lamp/parts/Head.tsx`
- Test: `src/lamp/geometry/headGeometry.test.ts`, `src/lamp/parts/Head.test.tsx`

**Interfaces:**
- Consumes: `LAMP`, `three-bvh-csg`.
- Produces:
  - `buildHeadGeometry(): BufferGeometry` — cono truncado hueco (pared `head.wall`) con `head.ventCount` slots radiales restados; boca (Ø grande) hacia abajo (−Y), centrado en origen del grupo de cabeza.
  - `buildReflectorGeometry(): BufferGeometry` — cono truncado hueco (Ø0.75→0.65).
  - `Head(props: ThreeElements['group']): JSX.Element` — frustum + reflector interno + bulbo (esfera).

- [ ] **Step 1: Test de los builders (rojo)** `src/lamp/geometry/headGeometry.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildHeadGeometry } from './headGeometry'
import { buildReflectorGeometry } from './reflectorGeometry'

describe('head/reflector geometry', () => {
  it('cabeza: Ø boca≈0.8, alto≈0.7, geometría no vacía', () => {
    const geo = buildHeadGeometry()
    geo.computeBoundingBox()
    const bb = geo.boundingBox!
    expect(bb.max.x - bb.min.x).toBeCloseTo(0.8, 1)
    expect(bb.max.y - bb.min.y).toBeCloseTo(0.7, 1)
    expect(geo.attributes.position.count).toBeGreaterThan(0)
  })

  it('reflector: geometría no vacía y más angosta que la cabeza', () => {
    const geo = buildReflectorGeometry()
    geo.computeBoundingBox()
    const bb = geo.boundingBox!
    expect(bb.max.x - bb.min.x).toBeLessThan(0.8)
    expect(geo.attributes.position.count).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Ejecutar (rojo)**

Run: `npx vitest run src/lamp/geometry/headGeometry.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar `src/lamp/geometry/headGeometry.ts`**

```ts
import { BoxGeometry, BufferGeometry, CylinderGeometry } from 'three'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg'
import { LAMP } from '../constants'

// Cono truncado hueco con vents radiales. CylinderGeometry con radios distintos
// arriba/abajo = cono truncado. Boca ancha hacia -Y.
export function buildHeadGeometry(): BufferGeometry {
  const { outerBottomR, outerTopR, height, wall, ventCount, ventW, ventH } = LAMP.head
  const evaluator = new Evaluator()
  evaluator.attributes = ['position', 'normal']

  // outer e inner: CylinderGeometry(radiusTop, radiusBottom, height, radial)
  const outer = new Brush(new CylinderGeometry(outerTopR, outerBottomR, height, 48, 1, true))
  outer.updateMatrixWorld()
  const inner = new Brush(
    new CylinderGeometry(outerTopR - wall, outerBottomR - wall, height + 0.02, 48, 1, true),
  )
  inner.updateMatrixWorld()
  let result = evaluator.evaluate(outer, inner, SUBTRACTION)

  // Vents: boxes finos restados cerca del extremo angosto (+Y), distribuidos radial.
  const ventRadius = (outerTopR + (outerBottomR - outerTopR) * 0.25) // ~cerca del top
  const ventY = height / 2 - 0.12
  for (let i = 0; i < ventCount; i++) {
    const a = (i / ventCount) * Math.PI * 2
    const slot = new Brush(new BoxGeometry(ventW, ventH, wall * 4))
    slot.position.set(Math.cos(a) * ventRadius, ventY, Math.sin(a) * ventRadius)
    slot.rotation.y = -a
    slot.updateMatrixWorld()
    result = evaluator.evaluate(result, slot, SUBTRACTION)
  }
  return result.geometry
}
```

- [ ] **Step 4: Implementar `src/lamp/geometry/reflectorGeometry.ts`**

```ts
import { BufferGeometry, CylinderGeometry } from 'three'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg'
import { LAMP } from '../constants'

// Cono truncado hueco interior (reflector), Ø0.75 -> Ø0.65, pared 0.05.
export function buildReflectorGeometry(): BufferGeometry {
  const { bottomR, topR, height, wall } = LAMP.reflector
  const evaluator = new Evaluator()
  evaluator.attributes = ['position', 'normal']
  const outer = new Brush(new CylinderGeometry(topR, bottomR, height, 48, 1, true))
  outer.updateMatrixWorld()
  const inner = new Brush(new CylinderGeometry(topR - wall, bottomR - wall, height + 0.02, 48, 1, true))
  inner.updateMatrixWorld()
  return evaluator.evaluate(outer, inner, SUBTRACTION).geometry
}
```

- [ ] **Step 5: Ejecutar (verde)**

Run: `npx vitest run src/lamp/geometry/headGeometry.test.ts`
Expected: PASS.

- [ ] **Step 6: Smoke test de la parte (rojo)** `src/lamp/parts/Head.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { Head } from './Head'

describe('Head', () => {
  it('monta frustum + reflector + bulbo (3 meshes) sin lanzar', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Head />)
    expect(renderer.scene.findAllByType('Mesh').length).toBe(3)
    await renderer.unmount()
  })
})
```

- [ ] **Step 7: Ejecutar (rojo)**

Run: `npx vitest run src/lamp/parts/Head.test.tsx`
Expected: FAIL.

- [ ] **Step 8: Implementar `src/lamp/parts/Head.tsx`**

```tsx
import { useMemo } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { buildHeadGeometry } from '../geometry/headGeometry'
import { buildReflectorGeometry } from '../geometry/reflectorGeometry'
import { LAMP } from '../constants'

export function Head(props: ThreeElements['group']) {
  const headGeo = useMemo(() => buildHeadGeometry(), [])
  const reflectorGeo = useMemo(() => buildReflectorGeometry(), [])
  return (
    <group {...props}>
      <mesh geometry={headGeo} castShadow receiveShadow>
        <meshStandardMaterial color="#d8d8dc" roughness={0.35} metalness={0.5} />
      </mesh>
      <mesh geometry={reflectorGeo}>
        <meshStandardMaterial color="#f4f4f0" roughness={0.2} metalness={0.1} side={2} />
      </mesh>
      <mesh position={[0, -LAMP.head.height / 2 + 0.18, 0]}>
        <sphereGeometry args={[LAMP.bulb.radius, 24, 24]} />
        <meshStandardMaterial color="#fff6cc" emissive="#ffe9a3" emissiveIntensity={0.6} />
      </mesh>
    </group>
  )
}
```

- [ ] **Step 9: Ejecutar (verde) + typecheck**

Run: `npx vitest run src/lamp/parts/Head.test.tsx`
Expected: PASS.
Run: `npx tsc -b`
Expected: exit 0.

---

### Task 7: `Lamp.tsx` — jerarquía de pivots + refs de joints + pose de reposo

**Files:**
- Create: `src/lamp/Lamp.tsx`
- Test: `src/lamp/Lamp.test.tsx`

**Interfaces:**
- Consumes: `Base`, `Arm`, `Head`, `Spring`, `LAMP`.
- Produces: `Lamp(props: { joints?: Partial<JointAngles> } & ThreeElements['group'])`, donde
  `type JointAngles = { shoulder: number; elbow: number; head: number }` (radianes, eje Z). Exporta también `type JointAngles`.

- [ ] **Step 1: Smoke test (rojo)** `src/lamp/Lamp.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { Lamp } from './Lamp'

describe('Lamp', () => {
  it('ensambla la lámpara (varias mallas) y respeta ángulos de joints sin lanzar', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <Lamp joints={{ shoulder: 0.3, elbow: -0.4, head: 0.2 }} />,
    )
    // base(2) + lower pair(2) + spring(1) + upper pair(2) + head(3) + pivots
    expect(renderer.scene.findAllByType('Mesh').length).toBeGreaterThanOrEqual(10)
    await renderer.unmount()
  })
})
```

- [ ] **Step 2: Ejecutar (rojo)**

Run: `npx vitest run src/lamp/Lamp.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar `src/lamp/Lamp.tsx`**

```tsx
import type { ThreeElements } from '@react-three/fiber'
import { Base } from './parts/Base'
import { Arm } from './parts/Arm'
import { Head } from './parts/Head'
import { Spring } from './parts/Spring'
import { LAMP } from './constants'

export type JointAngles = { shoulder: number; elbow: number; head: number }

const REST: JointAngles = { shoulder: 0.5, elbow: -0.9, head: -0.4 } // pose ≈ side-view

type Props = { joints?: Partial<JointAngles> } & ThreeElements['group']

export function Lamp({ joints, ...props }: Props) {
  const j = { ...REST, ...joints }
  const neckTop = LAMP.base.height + LAMP.neck.height
  const lowerLen = LAMP.lowerArm.length
  const upperLen = LAMP.upperArm.length

  return (
    <group {...props}>
      <Base />
      {/* Shoulder: gira el brazo inferior desde el tope del neck */}
      <group position={[0, neckTop, 0]} rotation={[0, 0, j.shoulder]}>
        {/* el brazo se dibuja centrado en X; lo corremos para que el pivote quede en un extremo */}
        <group position={[0, lowerLen / 2 - 0.12, 0]} rotation={[0, 0, 0]}>
          <group rotation={[0, 0, -Math.PI / 2]}>
            <Arm length={lowerLen} />
            <Spring position={[0, 0, 0]} />
          </group>
          {/* Elbow al otro extremo del brazo inferior */}
          <group position={[0, lowerLen / 2 - 0.12, 0]} rotation={[0, 0, j.elbow]}>
            <mesh castShadow>
              <boxGeometry args={[LAMP.pivotBlock.x, LAMP.pivotBlock.y, LAMP.pivotBlock.z]} />
              <meshStandardMaterial color="#3a3a40" roughness={0.4} metalness={0.4} />
            </mesh>
            <group position={[0, upperLen / 2 - 0.12, 0]}>
              <group rotation={[0, 0, -Math.PI / 2]}>
                <Arm length={upperLen} />
              </group>
              {/* Head joint al final del brazo superior */}
              <group position={[0, upperLen / 2 - 0.12, 0]} rotation={[0, 0, j.head]}>
                <mesh castShadow>
                  <cylinderGeometry
                    args={[LAMP.headPivot.diameter / 2, LAMP.headPivot.diameter / 2, 0.18, 20]}
                  />
                  <meshStandardMaterial color="#3a3a40" metalness={0.5} roughness={0.3} />
                </mesh>
                <Head position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]} />
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}
```

Nota de implementación: los offsets de `position` que recolocan cada brazo respecto de su pivote (`lowerLen/2 - 0.12`, etc.) y las rotaciones de encuadre (`-Math.PI/2`) son la pose de reposo aproximada; se ajustan a ojo en Task 8 con los sliders. Lo esencial verificable aquí: la jerarquía monta, acepta `joints` y no lanza.

- [ ] **Step 4: Ejecutar (verde) + typecheck**

Run: `npx vitest run src/lamp/Lamp.test.tsx`
Expected: PASS.
Run: `npx tsc -b`
Expected: exit 0.

---

### Task 8: `LampScene.tsx` — Canvas + luces + Leva de joints

**Files:**
- Create: `src/lamp/LampScene.tsx`
- Test: `src/lamp/LampScene.test.tsx`

**Interfaces:**
- Consumes: `Lamp`, `JointAngles`.
- Produces: `LampScene(): JSX.Element` — `<Canvas>` con luces, Environment, ContactShadows, OrbitControls y `<Lamp>` cuyos ángulos vienen de un panel Leva. Exporta `LampContent` (el contenido sin `<Canvas>`) para poder testearlo.

- [ ] **Step 1: Smoke test (rojo)** `src/lamp/LampScene.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { LampContent } from './LampScene'

vi.mock('@react-three/drei', async (importOriginal) => {
  const original = await importOriginal<typeof import('@react-three/drei')>()
  return { ...original, Environment: () => null, ContactShadows: () => null }
})

describe('LampContent', () => {
  it('monta luz direccional + lámpara sin lanzar', async () => {
    const renderer = await ReactThreeTestRenderer.create(<LampContent />)
    expect(renderer.scene.findAllByType('DirectionalLight').length).toBeGreaterThan(0)
    expect(renderer.scene.findAllByType('Mesh').length).toBeGreaterThan(0)
    await renderer.unmount()
  })
})
```

- [ ] **Step 2: Ejecutar (rojo)**

Run: `npx vitest run src/lamp/LampScene.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar `src/lamp/LampScene.tsx`**

```tsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { useControls } from 'leva'
import { Lamp } from './Lamp'

export function LampContent() {
  const { shoulder, elbow, head } = useControls('Lámpara (joints)', {
    shoulder: { value: 0.5, min: -1.2, max: 1.2, step: 0.01 },
    elbow: { value: -0.9, min: -2.0, max: 0.4, step: 0.01 },
    head: { value: -0.4, min: -1.2, max: 1.2, step: 0.01 },
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
```

- [ ] **Step 4: Ejecutar (verde) + typecheck**

Run: `npx vitest run src/lamp/LampScene.test.tsx`
Expected: PASS.
Run: `npx tsc -b`
Expected: exit 0.

---

### Task 9: Routing en `App.tsx` + verificación final

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `LampScene`, `react-router-dom`, y los componentes actuales (`Scene`, `SquashControls`, `Leva`).

Nota: `App` es glue de routing. No hay `@testing-library/react` en el proyecto y no se agrega solo para esto; se verifica con `tsc`/`build` y en el navegador (Step 4). La escena actual queda intacta dentro de `PixarRoute`.

- [ ] **Step 1: Reescribir `src/App.tsx` con routing**

```tsx
import { useRef } from 'react'
import type { Mesh } from 'three'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Leva } from 'leva'
import { Scene } from './scene/Scene'
import { SquashControls } from './scene/SquashControls'
import { LampScene } from './lamp/LampScene'

function PixarRoute() {
  const iRef = useRef<Mesh>(null)
  return (
    <>
      <Leva collapsed={false} />
      <SquashControls target={iRef} />
      <Scene iRef={iRef} />
    </>
  )
}

const navStyle: React.CSSProperties = {
  position: 'fixed', top: 8, left: 8, zIndex: 10, display: 'flex', gap: 8,
  font: '14px system-ui', background: 'rgba(0,0,0,.4)', padding: '6px 10px', borderRadius: 6,
}

export default function App() {
  return (
    <BrowserRouter>
      <nav style={navStyle}>
        <Link to="/" style={{ color: '#fff' }}>PIXAR</Link>
        <Link to="/lamp" style={{ color: '#fff' }}>Lámpara</Link>
      </nav>
      <Routes>
        <Route path="/" element={<PixarRoute />} />
        <Route path="/lamp" element={<LampScene />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 2: Suite completa + lint + build**

Run: `npm run test`
Expected: todos PASS.
Run: `npm run lint`
Expected: 0 errores.
Run: `npm run build`
Expected: exit 0.

- [ ] **Step 3: Verificación visual**

Run: `npm run dev` → abrir el navegador.
Expected:
- En `/` la escena PIXAR sigue **idéntica** (texto negro, fondo #64b5f6, panel squash funcionando).
- En `/lamp` se ve la lámpara ensamblada (base domo, dos brazos articulados, resorte en el inferior, cabeza con vents y bulbo). Los sliders de Leva mueven shoulder/elbow/head.
- Sin errores en consola. Parar el server (o dejarlo al usuario).

---

## Notas de implementación / riesgos

- **API three-bvh-csg 0.0.18:** `new Evaluator()`, `evaluator.attributes = ['position','normal']`, `new Brush(geometry)`, `brush.updateMatrixWorld()` tras posicionar, `evaluator.evaluate(a, b, SUBTRACTION)` devuelve un `Brush`; su `.geometry` es el resultado. Si algún nombre difiere en la versión instalada, consultar `node_modules/three-bvh-csg` y ajustar (no inventar).
- **CSG en useMemo:** cada builder se llama una vez por instancia montada (StrictMode en dev lo recomputa una vez más, solo dev; aceptable).
- **Pose de reposo:** los offsets/rotaciones de `Lamp.tsx` son aproximados; afinarlos a ojo con los sliders Leva en Task 8/9. El criterio de los tests es estructural (monta, no lanza, cuenta de mallas), no la pose exacta.
- **Frustum/reflector (aprox.):** `head.outerTopR`, `reflector.topR/height` no están cotados; viven en `constants.ts` y se ajustan visualmente.
- **`side={2}`** en el material del reflector = `THREE.DoubleSide` (visible por dentro).
- **react-router-dom v7** usa la misma API `BrowserRouter/Routes/Route/Link`.
