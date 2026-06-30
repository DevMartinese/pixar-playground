# Jumper (cilindro saltando) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un cilindro que salta de forma notoria (squash & stretch) cruzando la escena PIXAR, animado con el adapter three de anime.js.

**Architecture:** La lógica de animación vive en un módulo puro (`jumpAnimation.ts`) que construye un `Timeline` de anime.js sobre un `Object3D` — testeable de forma aislada con un objeto three. El componente R3F `Jumper.tsx` solo renderiza un grupo animado (cilindro) y conecta el timeline en un `useEffect`. Se integra en `Scene.tsx`. El salto se anima sobre un **grupo** (no la malla): así la escala squash/stretch ocurre alrededor del origen al ras del suelo (base apoyada) y la traslación `y`/`x` no pisa el offset de la malla.

**Tech Stack:** React 19, @react-three/fiber, three 0.184, animejs 4 (+ adapter three), vitest, @react-three/test-renderer.

## Global Constraints

- El adapter three de anime.js anima estas propiedades (confirmado por `src/scene/animeAdapter.test.ts`): `x/y/z` (posición), `scaleX/Y/Z` (escala), `rotateX/Y/Z` (rotación en grados). Cualquier módulo que anime mallas three debe `import './animeAdapter'` antes.
- Patrón de limpieza obligatorio: todo timeline se limpia con `.revert()` al desmontar (igual que `src/scene/SquashControls.tsx`).
- Comando de test: `npm test -- <ruta>` (vitest run con filtro de archivo). Lint: `npm run lint`. Build: `npm run build`.
- **Git:** el proyecto **no** es repo git. Los pasos de commit son opcionales; si los querés, corré `git init` una vez antes del primer commit. Si no usás git, salteá los pasos "Commit".

---

### Task 1: Módulo de animación del salto (`jumpAnimation.ts`)

**Files:**
- Create: `src/scene/jumpAnimation.ts`
- Test: `src/scene/jumpAnimation.test.ts`

**Interfaces:**
- Consumes: `createTimeline` de `animejs`; el side-effect `./animeAdapter`.
- Produces:
  - `type JumpParams = { hopHeight: number; hopStep: number; hops: number; squashY: number; stretchY: number; squashXZ: number; stretchXZ: number; anticipateMs: number; ascendMs: number; fallMs: number; landMs: number }`
  - `const DEFAULT_JUMP: JumpParams`
  - `buildJumpTimeline(obj: Object3D, params?: JumpParams): ReturnType<typeof createTimeline>` — construye y devuelve un timeline en bucle que: por cada salto hace anticipación (squash en el suelo), ascenso (sube a `hopHeight` + stretch + avanza medio `hopStep` en `x`), caída (baja a `y=0` + escala neutra + completa el `hopStep`) y aterrizaje (squash + recuperación elástica). Tras `hops` saltos el bucle reinicia (vuelve a `x=0`, `y=0`).

- [ ] **Step 1: Escribir el test que falla**

Crear `src/scene/jumpAnimation.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { buildJumpTimeline, DEFAULT_JUMP } from './jumpAnimation'

describe('buildJumpTimeline', () => {
  it('aplasta el objeto en la anticipación, todavía en el suelo', () => {
    const obj = new THREE.Group()
    const tl = buildJumpTimeline(obj, DEFAULT_JUMP)
    tl.pause()
    tl.seek(DEFAULT_JUMP.anticipateMs) // fin de la anticipación
    expect(obj.scale.y).toBeLessThan(1) // squash vertical
    expect(obj.scale.x).toBeGreaterThan(1) // ensanche horizontal
    expect(obj.position.y).toBeCloseTo(0) // aún sin despegar
    tl.revert()
  })

  it('eleva y estira el objeto en la cima del primer salto', () => {
    const obj = new THREE.Group()
    const tl = buildJumpTimeline(obj, DEFAULT_JUMP)
    tl.pause()
    const apex = DEFAULT_JUMP.anticipateMs + DEFAULT_JUMP.ascendMs // cima del arco
    tl.seek(apex)
    expect(obj.position.y).toBeCloseTo(DEFAULT_JUMP.hopHeight)
    expect(obj.scale.y).toBeGreaterThan(1) // stretch vertical
    expect(obj.scale.x).toBeLessThan(1) // afinado horizontal
    expect(obj.position.x).toBeGreaterThan(0) // avanzó hacia adelante
    tl.revert()
  })
})
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npm test -- src/scene/jumpAnimation.test.ts`
Expected: FAIL — no resuelve el módulo / `buildJumpTimeline is not a function` (`./jumpAnimation` no existe aún).

- [ ] **Step 3: Implementar el módulo**

Crear `src/scene/jumpAnimation.ts`:

```ts
import { createTimeline } from 'animejs'
import type { Object3D } from 'three'
import './animeAdapter'

export type JumpParams = {
  hopHeight: number // altura de la cima del arco (y)
  hopStep: number // avance en x por salto
  hops: number // saltos antes de reiniciar el bucle
  squashY: number // escala Y al aplastar (<1)
  stretchY: number // escala Y al estirar (>1)
  squashXZ: number // escala X/Z al aplastar (>1)
  stretchXZ: number // escala X/Z al estirar (<1)
  anticipateMs: number
  ascendMs: number
  fallMs: number
  landMs: number
}

export const DEFAULT_JUMP: JumpParams = {
  hopHeight: 1.5,
  hopStep: 1.9, // 8 saltos × 1.9 ≈ 15.2 ≈ ancho del texto "PIXAR"
  hops: 8,
  squashY: 0.6,
  stretchY: 1.25,
  squashXZ: 1.3,
  stretchXZ: 0.9, // ~conserva volumen con stretchY=1.25 (0.9²·1.25≈1.01)
  anticipateMs: 150,
  ascendMs: 300,
  fallMs: 250,
  landMs: 400,
}

// Construye un timeline en bucle que hace saltar a `obj` hacia adelante.
// Se anima un grupo (no la malla): la escala squash/stretch ocurre alrededor
// del origen al ras del suelo, manteniendo la base apoyada.
export function buildJumpTimeline(obj: Object3D, params: JumpParams = DEFAULT_JUMP) {
  const tl = createTimeline({ loop: true })
  for (let i = 0; i < params.hops; i++) {
    const x0 = i * params.hopStep
    const xMid = x0 + params.hopStep / 2
    const x1 = x0 + params.hopStep
    tl
      // 1. anticipación: squash en el lugar
      .add(obj, {
        scaleY: params.squashY,
        scaleX: params.squashXZ,
        scaleZ: params.squashXZ,
        ease: 'inQuad',
        duration: params.anticipateMs,
      })
      // 2. despegue + ascenso: sube a la cima + stretch + avanza medio paso
      .add(obj, {
        y: params.hopHeight,
        x: xMid,
        scaleY: params.stretchY,
        scaleX: params.stretchXZ,
        scaleZ: params.stretchXZ,
        ease: 'outQuad',
        duration: params.ascendMs,
      })
      // 3. caída: baja al suelo, escala neutra, completa el paso
      .add(obj, {
        y: 0,
        x: x1,
        scaleY: 1,
        scaleX: 1,
        scaleZ: 1,
        ease: 'inQuad',
        duration: params.fallMs,
      })
      // 4a. aterrizaje: squash de impacto
      .add(obj, {
        scaleY: params.squashY,
        scaleX: params.squashXZ,
        scaleZ: params.squashXZ,
        ease: 'outQuad',
        duration: params.landMs * 0.25,
      })
      // 4b. recuperación elástica a neutro
      .add(obj, {
        scaleY: 1,
        scaleX: 1,
        scaleZ: 1,
        ease: 'outElastic',
        duration: params.landMs * 0.75,
      })
  }
  return tl
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npm test -- src/scene/jumpAnimation.test.ts`
Expected: PASS (2 passing).

- [ ] **Step 5: Commit** (opcional, si usás git)

```bash
git add src/scene/jumpAnimation.ts src/scene/jumpAnimation.test.ts
git commit -m "feat: add jump timeline builder (squash & stretch hop)"
```

---

### Task 2: Componente `Jumper.tsx` (cilindro)

**Files:**
- Create: `src/scene/Jumper.tsx`
- Test: `src/scene/Jumper.test.tsx`

**Interfaces:**
- Consumes: `buildJumpTimeline` de `./jumpAnimation`.
- Produces: `Jumper(props: ThreeElements['group']): JSX.Element` — un grupo (acepta `position`, etc.) con un sub-grupo animado que contiene un cilindro (`cylinderGeometry`) apoyado en el suelo. Conecta el timeline en `useEffect` y lo limpia con `revert()` al desmontar.

- [ ] **Step 1: Escribir el test que falla**

Crear `src/scene/Jumper.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { Jumper } from './Jumper'

describe('Jumper', () => {
  it('monta un cilindro (Mesh) sin lanzar', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Jumper />)
    expect(renderer.scene.findAllByType('Mesh').length).toBeGreaterThan(0)
    await renderer.unmount()
  })
})
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npm test -- src/scene/Jumper.test.tsx`
Expected: FAIL — no resuelve `./Jumper` (el archivo no existe aún).

- [ ] **Step 3: Implementar el componente**

Crear `src/scene/Jumper.tsx`:

```tsx
import { useEffect, useRef } from 'react'
import type { Group } from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { buildJumpTimeline } from './jumpAnimation'

const HEIGHT = 1.2
const RADIUS = 0.5

// Cilindro que salta (estilo Luxo) cruzando la escena. El salto se anima sobre
// `animRef` (sub-grupo): así la escala squash/stretch ocurre al ras del suelo.
// La malla se eleva HEIGHT/2 para que la base quede en y=0. `props` posiciona
// el grupo exterior estático dentro de la escena.
export function Jumper(props: ThreeElements['group']) {
  const animRef = useRef<Group>(null)

  useEffect(() => {
    const group = animRef.current
    if (!group) return
    const tl = buildJumpTimeline(group)
    return () => {
      tl.revert()
    }
  }, [])

  return (
    <group {...props}>
      <group ref={animRef}>
        <mesh position={[0, HEIGHT / 2, 0]} castShadow>
          <cylinderGeometry args={[RADIUS, RADIUS, HEIGHT, 32]} />
          <meshStandardMaterial color="#e53935" roughness={0.4} metalness={0.1} />
        </mesh>
      </group>
    </group>
  )
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npm test -- src/scene/Jumper.test.tsx`
Expected: PASS (1 passing).

- [ ] **Step 5: Commit** (opcional, si usás git)

```bash
git add src/scene/Jumper.tsx src/scene/Jumper.test.tsx
git commit -m "feat: add Jumper cylinder component"
```

---

### Task 3: Integrar `Jumper` en la escena PIXAR

**Files:**
- Modify: `src/scene/Scene.tsx` (dentro de `SceneContent`)

**Interfaces:**
- Consumes: `Jumper` de `./Jumper`.
- Produces: nada nuevo; la escena ahora renderiza el cilindro saltando junto al texto.

- [ ] **Step 1: Agregar el import**

En `src/scene/Scene.tsx`, junto a los demás imports de escena (después de `import { PixarText } from './PixarText'`):

```tsx
import { Jumper } from './Jumper'
```

- [ ] **Step 2: Renderizar el Jumper**

En `src/scene/Scene.tsx`, dentro de `SceneContent`, justo después del `<PixarText ... />`, agregar:

```tsx
{/* Cilindro saltando (estilo Luxo). Cruza por delante del texto PIXAR a lo
    largo de toda su longitud (de la P a la R), apoyado en el suelo. El borde
    izquierdo del texto está en x≈-7.55; el recorrido del salto (8×1.9≈15.2)
    cubre el ancho del texto. Por ahora solo salta; todavía no se posa sobre la "I". */}
<Jumper position={[-7.55, 0, 1.8]} />
```

- [ ] **Step 3: Correr la suite de tests de la escena (no debe romperse)**

Run: `npm test -- src/scene/Scene.test.tsx src/scene/Jumper.test.tsx src/scene/jumpAnimation.test.ts`
Expected: PASS. `Scene.test.tsx` sigue verde: el conteo de `Mesh` solo aumenta.

- [ ] **Step 4: Lint + build + suite completa**

Run: `npm run lint`
Expected: sin errores.

Run: `npm test`
Expected: toda la suite PASS.

Run: `npm run build`
Expected: build exitoso (tsc + vite).

- [ ] **Step 5: Verificación visual (manual)**

Run: `npm run dev`
Abrir la ruta `/`. Esperado: el cilindro rojo aparece sobre la "P", salta hacia la derecha cruzando por delante del texto PIXAR a lo largo de toda su longitud (de la P a la R), con aplastado al despegar/aterrizar y estirado en el aire; al llegar al final reinicia desde la "P".

- [ ] **Step 6: Commit** (opcional, si usás git)

```bash
git add src/scene/Scene.tsx
git commit -m "feat: render jumping cylinder in PIXAR scene"
```

---

## Notas de verificación (self-review)

- **Cobertura del spec:** forma cilindro (Task 2), saltos hacia adelante en bucle con squash & stretch (Task 1), ubicación en escena PIXAR apoyado en el suelo (Task 3), uso del adapter three (Task 1, import `./animeAdapter` vía módulo). Testing con vitest + test-renderer (Tasks 1-2). Fuera de alcance (posarse sobre la "I", controles leva) — no incluido, correcto.
- **Consistencia de tipos:** `buildJumpTimeline(obj, params?)` y `DEFAULT_JUMP`/`JumpParams` usados igual en Task 1 (módulo + test) y Task 2 (componente). `Jumper` acepta `ThreeElements['group']` y se invoca con `position` en Task 3.
- **Squash al ras del suelo:** se anima el grupo (origen en y=0), no la malla (offset HEIGHT/2), por eso la escala no hunde el cilindro.
