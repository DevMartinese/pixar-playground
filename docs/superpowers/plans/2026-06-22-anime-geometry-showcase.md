# Entorno base R3F + showcase de geometrías (anime.js v4) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Instalar el stack 3D (three + R3F + drei + anime.js v4) sobre el template Vite/React existente y montar una escena con 6 estaciones que demuestran las features de anime.js aplicadas a geometrías.

**Architecture:** Un `<Canvas>` de R3F con entorno base (luces, Environment, ContactShadows, suelo, OrbitControls). Cada feature de anime.js vive en un componente "estación" aislado bajo `src/scene/stations/`, que crea su geometría con `ref` y monta su animación en un `useEffect` con limpieza por `.revert()`. El adapter de anime.js se registra una vez como import de side-effect.

**Tech Stack:** Vite 8, React 19, TypeScript, `three`, `@react-three/fiber` v9, `@react-three/drei`, `animejs` v4. Tests de humo con `vitest` + `@react-three/test-renderer` + `jsdom`.

## Global Constraints

- React 19 + TypeScript estricto (el template ya lo trae). No romper `npm run lint` ni `npm run build`.
- `three` >= 0.150 (peer dependency obligatoria del adapter de anime.js).
- `animejs` v4 (API modular: imports nombrados desde `'animejs'`).
- Las animaciones mutan el `Object3D` directamente; NUNCA animar vía `setState` ni re-render por frame.
- Convención del adapter de anime.js: `x/y/z` → `.position`; `rotateX/Y/Z` en **grados** → `.rotation` (radianes, conversión automática). No mezclar con la API nativa de three (radianes).
- El adapter se importa una sola vez vía `src/scene/animeAdapter.ts` (side-effect). Toda estación importa ese módulo antes de animar.
- Limpieza: cada `useEffect` guarda la instancia devuelta por anime.js y llama `.revert()` en el cleanup. (Desviación consciente del spec, que mencionaba `createScope`: para objetos three sin root DOM, `.revert()` por instancia es más fiable.)
- Un archivo por estación, una responsabilidad por archivo.

---

### Task 1: Instalar dependencias y harness de tests

**Files:**
- Modify: `package.json` (vía npm, no a mano)
- Create: `vitest.config.ts`
- Modify: `tsconfig.app.json` (añadir tipos de vitest si hace falta)

**Interfaces:**
- Produces: dependencias disponibles (`three`, `@react-three/fiber`, `@react-three/drei`, `animejs`) y script `npm run test` ejecutable con vitest + jsdom.

- [ ] **Step 1: Instalar dependencias de runtime**

```bash
cd /Users/gonzalomartinese/pixar-lamp
npm install three @react-three/fiber @react-three/drei animejs
```

- [ ] **Step 2: Instalar dependencias de dev (tipos + test)**

```bash
npm install -D @types/three vitest jsdom @react-three/test-renderer
```

- [ ] **Step 3: Crear `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
```

- [ ] **Step 4: Añadir el script de test a `package.json`**

En la sección `"scripts"`, añadir:

```json
"test": "vitest run"
```

- [ ] **Step 5: Verificar instalación y typecheck**

Run: `npx tsc -b`
Expected: termina sin errores (exit 0).

Run: `npm ls three @react-three/fiber @react-three/drei animejs`
Expected: las 4 listadas con versión resuelta; `three` >= 0.150 y `animejs` >= 4.

---

### Task 2: Registrar el adapter de anime.js + test de humo

**Files:**
- Create: `src/scene/animeAdapter.ts`
- Create: `src/scene/animeAdapter.test.ts`

**Interfaces:**
- Produces: módulo `src/scene/animeAdapter.ts` que, al importarse, registra el adapter three de anime.js globalmente (side-effect, sin exports).

- [ ] **Step 1: Escribir el test que falla**

`src/scene/animeAdapter.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { animate } from 'animejs'
import './animeAdapter'

describe('anime.js three adapter', () => {
  it('anima la posición de un Object3D via la convención x/y/z', () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial())
    const anim = animate(mesh, { x: 5, duration: 100 })
    anim.seek(anim.duration) // saltar al final
    expect(mesh.position.x).toBeCloseTo(5)
    anim.revert()
  })
})
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `npx vitest run src/scene/animeAdapter.test.ts`
Expected: FAIL (no existe `src/scene/animeAdapter.ts`).

- [ ] **Step 3: Crear `src/scene/animeAdapter.ts`**

```ts
// Registra el adapter de three.js de anime.js como side-effect.
// Importar este módulo UNA vez antes de animar objetos three.
import 'animejs/adapters/three'
```

- [ ] **Step 4: Ejecutar el test para verificar que pasa**

Run: `npx vitest run src/scene/animeAdapter.test.ts`
Expected: PASS.

---

### Task 3: Escena base (Canvas + entorno) y montaje en App

**Files:**
- Create: `src/scene/Scene.tsx`
- Create: `src/scene/Scene.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/index.css` (asegurar que el root ocupa el viewport)

**Interfaces:**
- Consumes: `./animeAdapter` (side-effect).
- Produces: `export function Scene(): JSX.Element` — monta `<Canvas>` con entorno base. En este task aún sin estaciones (se añaden en Task 10).

- [ ] **Step 1: Escribir el test de humo que falla**

`src/scene/Scene.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { Scene } from './Scene'

describe('Scene', () => {
  it('monta el canvas con al menos una luz y el suelo', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Scene />)
    const lights = renderer.scene.findAllByType('DirectionalLight')
    expect(lights.length).toBeGreaterThan(0)
    await renderer.unmount()
  })
})
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `npx vitest run src/scene/Scene.test.tsx`
Expected: FAIL (no existe `Scene`).

- [ ] **Step 3: Crear `src/scene/Scene.tsx`**

```tsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import './animeAdapter'

export function Scene() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 4, 12], fov: 50 }}
      style={{ width: '100vw', height: '100vh' }}
    >
      <color attach="background" args={['#15151a']} />

      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      <Environment preset="city" />

      {/* Suelo receptor de sombras */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#1d1d24" />
      </mesh>
      <ContactShadows position={[0, -1.49, 0]} opacity={0.5} scale={40} blur={2} far={8} />

      {/* Las estaciones se añaden en Task 10 */}

      <OrbitControls makeDefault />
    </Canvas>
  )
}
```

- [ ] **Step 4: Ejecutar el test para verificar que pasa**

Run: `npx vitest run src/scene/Scene.test.tsx`
Expected: PASS.

- [ ] **Step 5: Montar la escena en `src/App.tsx`**

Reemplazar el contenido de `src/App.tsx` por:

```tsx
import { Scene } from './scene/Scene'

export default function App() {
  return <Scene />
}
```

- [ ] **Step 6: Asegurar viewport completo en `src/index.css`**

Añadir al inicio de `src/index.css` (si no existe ya equivalente):

```css
html, body, #root {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
```

- [ ] **Step 7: Verificar typecheck y arranque**

Run: `npx tsc -b`
Expected: exit 0.

Run: `npm run dev` (arrancar, abrir http://localhost:5173, confirmar fondo oscuro + suelo + controles de órbita con el ratón, luego parar)
Expected: escena visible, sin errores en consola.

---

### Task 4: Estación 1 — SpringBox (`animate` + `createSpring`)

**Files:**
- Create: `src/scene/stations/SpringBox.tsx`
- Create: `src/scene/stations/SpringBox.test.tsx`

**Interfaces:**
- Consumes: `../animeAdapter`.
- Produces: `export function SpringBox(props: { position?: [number, number, number] }): JSX.Element`.

- [ ] **Step 1: Escribir el test de humo que falla**

`src/scene/stations/SpringBox.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { SpringBox } from './SpringBox'

describe('SpringBox', () => {
  it('monta una malla y se desmonta sin lanzar', async () => {
    const renderer = await ReactThreeTestRenderer.create(<SpringBox position={[0, 0, 0]} />)
    expect(renderer.scene.findAllByType('Mesh').length).toBeGreaterThan(0)
    await renderer.unmount()
  })
})
```

- [ ] **Step 2: Ejecutar para verificar que falla**

Run: `npx vitest run src/scene/stations/SpringBox.test.tsx`
Expected: FAIL (no existe `SpringBox`).

- [ ] **Step 3: Implementar `src/scene/stations/SpringBox.tsx`**

```tsx
import { useEffect, useRef } from 'react'
import type { Mesh } from 'three'
import { animate, createSpring } from 'animejs'
import '../animeAdapter'

type Props = { position?: [number, number, number] }

export function SpringBox({ position = [0, 0, 0] }: Props) {
  const ref = useRef<Mesh>(null)

  useEffect(() => {
    if (!ref.current) return
    const anim = animate(ref.current, {
      y: 2,
      rotateZ: 45,
      ease: createSpring({ stiffness: 120, damping: 8, mass: 1 }),
      duration: 1400,
      loop: true,
      alternate: true,
    })
    return () => anim.revert()
  }, [])

  return (
    <mesh ref={ref} position={position} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ff5d73" roughness={0.3} metalness={0.1} />
    </mesh>
  )
}
```

- [ ] **Step 4: Ejecutar para verificar que pasa**

Run: `npx vitest run src/scene/stations/SpringBox.test.tsx`
Expected: PASS.

---

### Task 5: Estación 2 — StaggerGrid (`stagger`)

**Files:**
- Create: `src/scene/stations/StaggerGrid.tsx`
- Create: `src/scene/stations/StaggerGrid.test.tsx`

**Interfaces:**
- Consumes: `../animeAdapter`.
- Produces: `export function StaggerGrid(props: { position?: [number, number, number] }): JSX.Element`.

- [ ] **Step 1: Escribir el test de humo que falla**

`src/scene/stations/StaggerGrid.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { StaggerGrid } from './StaggerGrid'

describe('StaggerGrid', () => {
  it('crea una malla por celda (5x5 = 25) y se desmonta sin lanzar', async () => {
    const renderer = await ReactThreeTestRenderer.create(<StaggerGrid position={[0, 0, 0]} />)
    expect(renderer.scene.findAllByType('Mesh').length).toBe(25)
    await renderer.unmount()
  })
})
```

- [ ] **Step 2: Ejecutar para verificar que falla**

Run: `npx vitest run src/scene/stations/StaggerGrid.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar `src/scene/stations/StaggerGrid.tsx`**

```tsx
import { useEffect, useRef } from 'react'
import type { Group } from 'three'
import { animate, stagger } from 'animejs'
import '../animeAdapter'

type Props = { position?: [number, number, number] }

const SIZE = 5
const SPACING = 1.1
const cells = Array.from({ length: SIZE * SIZE }, (_, i) => i)

export function StaggerGrid({ position = [0, 0, 0] }: Props) {
  const group = useRef<Group>(null)

  useEffect(() => {
    if (!group.current) return
    const targets = group.current.children
    const anim = animate(targets, {
      scale: 1.6,
      rotateY: 180,
      delay: stagger(80, { grid: [SIZE, SIZE], from: 'center' }),
      duration: 700,
      loop: true,
      alternate: true,
      ease: 'inOutQuad',
    })
    return () => anim.revert()
  }, [])

  return (
    <group ref={group} position={position}>
      {cells.map((i) => {
        const col = i % SIZE
        const row = Math.floor(i / SIZE)
        const x = (col - (SIZE - 1) / 2) * SPACING
        const z = (row - (SIZE - 1) / 2) * SPACING
        return (
          <mesh key={i} position={[x, 0, z]} castShadow>
            <boxGeometry args={[0.7, 0.7, 0.7]} />
            <meshStandardMaterial color="#4dd0e1" roughness={0.4} />
          </mesh>
        )
      })}
    </group>
  )
}
```

- [ ] **Step 4: Ejecutar para verificar que pasa**

Run: `npx vitest run src/scene/stations/StaggerGrid.test.tsx`
Expected: PASS.

---

### Task 6: Estación 3 — TimelineTrio (`createTimeline`)

**Files:**
- Create: `src/scene/stations/TimelineTrio.tsx`
- Create: `src/scene/stations/TimelineTrio.test.tsx`

**Interfaces:**
- Consumes: `../animeAdapter`.
- Produces: `export function TimelineTrio(props: { position?: [number, number, number] }): JSX.Element`.

- [ ] **Step 1: Escribir el test de humo que falla**

`src/scene/stations/TimelineTrio.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { TimelineTrio } from './TimelineTrio'

describe('TimelineTrio', () => {
  it('monta tres mallas y se desmonta sin lanzar', async () => {
    const renderer = await ReactThreeTestRenderer.create(<TimelineTrio position={[0, 0, 0]} />)
    expect(renderer.scene.findAllByType('Mesh').length).toBe(3)
    await renderer.unmount()
  })
})
```

- [ ] **Step 2: Ejecutar para verificar que falla**

Run: `npx vitest run src/scene/stations/TimelineTrio.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar `src/scene/stations/TimelineTrio.tsx`**

```tsx
import { useEffect, useRef } from 'react'
import type { Mesh } from 'three'
import { createTimeline } from 'animejs'
import '../animeAdapter'

type Props = { position?: [number, number, number] }

export function TimelineTrio({ position = [0, 0, 0] }: Props) {
  const sphere = useRef<Mesh>(null)
  const torus = useRef<Mesh>(null)
  const cone = useRef<Mesh>(null)

  useEffect(() => {
    if (!sphere.current || !torus.current || !cone.current) return
    const tl = createTimeline({ loop: true, alternate: true })
    tl.add(sphere.current, { y: 1.5, ease: 'outBack', duration: 600 })
      .add(torus.current, { rotateX: 360, ease: 'inOutQuad', duration: 800 })
      .add(cone.current, { y: 1.5, rotateZ: 180, ease: 'outElastic', duration: 900 })
    return () => tl.revert()
  }, [])

  return (
    <group position={position}>
      <mesh ref={sphere} position={[-2, 0, 0]} castShadow>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial color="#ffb74d" roughness={0.3} />
      </mesh>
      <mesh ref={torus} position={[0, 0, 0]} castShadow>
        <torusGeometry args={[0.6, 0.22, 16, 48]} />
        <meshStandardMaterial color="#ba68c8" roughness={0.3} />
      </mesh>
      <mesh ref={cone} position={[2, 0, 0]} castShadow>
        <coneGeometry args={[0.6, 1.2, 32]} />
        <meshStandardMaterial color="#81c784" roughness={0.3} />
      </mesh>
    </group>
  )
}
```

- [ ] **Step 4: Ejecutar para verificar que pasa**

Run: `npx vitest run src/scene/stations/TimelineTrio.test.tsx`
Expected: PASS.

---

### Task 7: Estación 4 — TimerKnot (`createTimer`)

**Files:**
- Create: `src/scene/stations/TimerKnot.tsx`
- Create: `src/scene/stations/TimerKnot.test.tsx`

**Interfaces:**
- Consumes: `../animeAdapter`.
- Produces: `export function TimerKnot(props: { position?: [number, number, number] }): JSX.Element`.

- [ ] **Step 1: Escribir el test de humo que falla**

`src/scene/stations/TimerKnot.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { TimerKnot } from './TimerKnot'

describe('TimerKnot', () => {
  it('monta una malla y se desmonta sin lanzar', async () => {
    const renderer = await ReactThreeTestRenderer.create(<TimerKnot position={[0, 0, 0]} />)
    expect(renderer.scene.findAllByType('Mesh').length).toBeGreaterThan(0)
    await renderer.unmount()
  })
})
```

- [ ] **Step 2: Ejecutar para verificar que falla**

Run: `npx vitest run src/scene/stations/TimerKnot.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar `src/scene/stations/TimerKnot.tsx`**

`createTimer` es un driver de tiempo puro (sin target). Lo usamos para mover los transforms del knot manualmente cada update, demostrando el reloj de anime.js.

```tsx
import { useEffect, useRef } from 'react'
import type { Mesh } from 'three'
import { createTimer } from 'animejs'
import '../animeAdapter'

type Props = { position?: [number, number, number] }

export function TimerKnot({ position = [0, 0, 0] }: Props) {
  const ref = useRef<Mesh>(null)

  useEffect(() => {
    if (!ref.current) return
    const mesh = ref.current
    const timer = createTimer({
      duration: Infinity,
      onUpdate: (self) => {
        const t = self.currentTime / 1000
        mesh.rotation.x = t * 0.6
        mesh.rotation.y = t * 0.9
      },
    })
    return () => timer.revert()
  }, [])

  return (
    <mesh ref={ref} position={position} castShadow>
      <torusKnotGeometry args={[0.6, 0.2, 128, 16]} />
      <meshStandardMaterial color="#f06292" roughness={0.25} metalness={0.3} />
    </mesh>
  )
}
```

- [ ] **Step 4: Ejecutar para verificar que pasa**

Run: `npx vitest run src/scene/stations/TimerKnot.test.tsx`
Expected: PASS.

---

### Task 8: Estación 5 — AnimatableIco (`createAnimatable`)

**Files:**
- Create: `src/scene/stations/AnimatableIco.tsx`
- Create: `src/scene/stations/AnimatableIco.test.tsx`

**Interfaces:**
- Consumes: `../animeAdapter`, `@react-three/fiber` (`useFrame`, `useThree`).
- Produces: `export function AnimatableIco(props: { position?: [number, number, number] }): JSX.Element`.

- [ ] **Step 1: Escribir el test de humo que falla**

`src/scene/stations/AnimatableIco.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { AnimatableIco } from './AnimatableIco'

describe('AnimatableIco', () => {
  it('monta una malla y se desmonta sin lanzar', async () => {
    const renderer = await ReactThreeTestRenderer.create(<AnimatableIco position={[0, 0, 0]} />)
    expect(renderer.scene.findAllByType('Mesh').length).toBeGreaterThan(0)
    await renderer.unmount()
  })
})
```

- [ ] **Step 2: Ejecutar para verificar que falla**

Run: `npx vitest run src/scene/stations/AnimatableIco.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar `src/scene/stations/AnimatableIco.tsx`**

`createAnimatable` da setters con suavizado. El puntero (en coords de mundo del plano) alimenta los setters; el ico persigue el cursor con inercia.

```tsx
import { useEffect, useRef } from 'react'
import type { Mesh } from 'three'
import { useThree } from '@react-three/fiber'
import { createAnimatable } from 'animejs'
import '../animeAdapter'

type Props = { position?: [number, number, number] }

export function AnimatableIco({ position = [0, 0, 0] }: Props) {
  const ref = useRef<Mesh>(null)
  const gl = useThree((s) => s.gl)
  const [ox, oy] = [position[0], position[1]]

  useEffect(() => {
    if (!ref.current) return
    const animatable = createAnimatable(ref.current, {
      x: { duration: 400, ease: 'out(3)' },
      y: { duration: 400, ease: 'out(3)' },
    })
    const el = gl.domElement
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
      animatable.x(ox + nx * 2.5)
      animatable.y(oy + ny * 2.5)
    }
    el.addEventListener('pointermove', onMove)
    return () => {
      el.removeEventListener('pointermove', onMove)
      animatable.revert()
    }
  }, [gl, ox, oy])

  return (
    <mesh ref={ref} position={position} castShadow>
      <icosahedronGeometry args={[0.8, 0]} />
      <meshStandardMaterial color="#9ccc65" roughness={0.2} metalness={0.2} flatShading />
    </mesh>
  )
}
```

- [ ] **Step 4: Ejecutar para verificar que pasa**

Run: `npx vitest run src/scene/stations/AnimatableIco.test.tsx`
Expected: PASS.

---

### Task 9: Estación 6 — EaseRow (catálogo de `eases`)

**Files:**
- Create: `src/scene/stations/EaseRow.tsx`
- Create: `src/scene/stations/EaseRow.test.tsx`

**Interfaces:**
- Consumes: `../animeAdapter`.
- Produces: `export function EaseRow(props: { position?: [number, number, number] }): JSX.Element`.

- [ ] **Step 1: Escribir el test de humo que falla**

`src/scene/stations/EaseRow.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { EaseRow } from './EaseRow'

describe('EaseRow', () => {
  it('crea una cápsula por ease (6) y se desmonta sin lanzar', async () => {
    const renderer = await ReactThreeTestRenderer.create(<EaseRow position={[0, 0, 0]} />)
    expect(renderer.scene.findAllByType('Mesh').length).toBe(6)
    await renderer.unmount()
  })
})
```

- [ ] **Step 2: Ejecutar para verificar que falla**

Run: `npx vitest run src/scene/stations/EaseRow.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar `src/scene/stations/EaseRow.tsx`**

```tsx
import { useEffect, useRef } from 'react'
import type { Group } from 'three'
import { animate, createSpring } from 'animejs'
import type { EasingParam } from 'animejs'
import '../animeAdapter'

type Props = { position?: [number, number, number] }

const EASES: { name: string; ease: EasingParam }[] = [
  { name: 'linear', ease: 'linear' },
  { name: 'inOutQuad', ease: 'inOutQuad' },
  { name: 'outElastic', ease: 'outElastic' },
  { name: 'outBounce', ease: 'outBounce' },
  { name: 'inOutExpo', ease: 'inOutExpo' },
  { name: 'spring', ease: createSpring({ stiffness: 100, damping: 6 }) },
]

const SPACING = 1.2

export function EaseRow({ position = [0, 0, 0] }: Props) {
  const group = useRef<Group>(null)

  useEffect(() => {
    if (!group.current) return
    const anims = EASES.map((e, i) =>
      animate(group.current!.children[i], {
        y: 3,
        ease: e.ease,
        duration: 1600,
        loop: true,
        alternate: true,
      }),
    )
    return () => anims.forEach((a) => a.revert())
  }, [])

  return (
    <group ref={group} position={position}>
      {EASES.map((e, i) => {
        const x = (i - (EASES.length - 1) / 2) * SPACING
        return (
          <mesh key={e.name} position={[x, 0, 0]} castShadow>
            <capsuleGeometry args={[0.3, 0.6, 8, 16]} />
            <meshStandardMaterial color="#64b5f6" roughness={0.35} />
          </mesh>
        )
      })}
    </group>
  )
}
```

Nota: si `EasingParam` no está exportado por `animejs` en la versión instalada, sustituir el tipo del array por `{ name: string; ease: Parameters<typeof animate>[1]['ease'] }` o, como fallback simple, `any` solo en esa anotación. Verificar con `npx tsc -b` en el Step 4.

- [ ] **Step 4: Ejecutar para verificar que pasa + typecheck**

Run: `npx vitest run src/scene/stations/EaseRow.test.tsx`
Expected: PASS.

Run: `npx tsc -b`
Expected: exit 0 (ajustar el tipo del ease según la nota si falla).

---

### Task 10: Componer las estaciones en la escena + verificación final

**Files:**
- Modify: `src/scene/Scene.tsx`
- Create: `src/scene/Scene.stations.test.tsx`

**Interfaces:**
- Consumes: las 6 estaciones de `./stations/*`.

- [ ] **Step 1: Escribir el test que falla (escena completa)**

`src/scene/Scene.stations.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { Scene } from './Scene'

describe('Scene con estaciones', () => {
  it('renderiza muchas mallas (estaciones + suelo) sin lanzar', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Scene />)
    // 1 (box) + 25 (grid) + 3 (trio) + 1 (knot) + 1 (ico) + 6 (eases) + 1 (suelo) = 38
    expect(renderer.scene.findAllByType('Mesh').length).toBeGreaterThanOrEqual(38)
    await renderer.unmount()
  })
})
```

- [ ] **Step 2: Ejecutar para verificar que falla**

Run: `npx vitest run src/scene/Scene.stations.test.tsx`
Expected: FAIL (la escena aún no incluye estaciones).

- [ ] **Step 3: Añadir las estaciones a `src/scene/Scene.tsx`**

Añadir los imports tras los existentes:

```tsx
import { SpringBox } from './stations/SpringBox'
import { StaggerGrid } from './stations/StaggerGrid'
import { TimelineTrio } from './stations/TimelineTrio'
import { TimerKnot } from './stations/TimerKnot'
import { AnimatableIco } from './stations/AnimatableIco'
import { EaseRow } from './stations/EaseRow'
```

Reemplazar el comentario `{/* Las estaciones se añaden en Task 10 */}` por:

```tsx
<SpringBox position={[-8, 0, 0]} />
<StaggerGrid position={[-2, 0, -4]} />
<TimelineTrio position={[6, 0, 0]} />
<TimerKnot position={[-8, 0, 5]} />
<AnimatableIco position={[0, 1, 4]} />
<EaseRow position={[4, 0, 6]} />
```

- [ ] **Step 4: Ejecutar para verificar que pasa**

Run: `npx vitest run src/scene/Scene.stations.test.tsx`
Expected: PASS.

- [ ] **Step 5: Suite completa + lint + build**

Run: `npm run test`
Expected: todos los tests PASS.

Run: `npm run lint`
Expected: 0 errores.

Run: `npm run build`
Expected: build correcto (tsc + vite), exit 0.

- [ ] **Step 6: Verificación visual**

Run: `npm run dev` → abrir http://localhost:5173
Expected: las 6 estaciones visibles y animándose; el icosaedro persigue el cursor; OrbitControls funciona; sin errores en consola. Parar el servidor.

---

## Notas de implementación / riesgos

- **API de anime.js v4:** los imports nombrados (`animate`, `createTimeline`, `createTimer`, `createAnimatable`, `stagger`, `createSpring`) salen de `'animejs'`; el adapter de `'animejs/adapters/three'` es side-effect. Si algún nombre difiere en la versión instalada, consultar https://animejs.com/documentation/ y ajustar (no inventar firmas).
- **`@react-three/test-renderer` + React 19:** requiere R3F v9. Si el renderer de test da problemas de peer deps, los tests de humo pueden degradarse a comprobar que el módulo exporta el componente, pero priorizar arreglar la versión.
- **Convención de ángulos:** en el adapter `rotateX/Y/Z` van en grados; en acceso nativo (`mesh.rotation.x` en TimerKnot) van en radianes. Es intencional y está documentado en Global Constraints.
- **Limpieza:** todo `useEffect` revierte su animación en el cleanup para evitar fugas en HMR y al desmontar.
