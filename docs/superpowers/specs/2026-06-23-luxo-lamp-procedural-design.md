# Diseño: Lámpara Luxo procedural (primitivas + CSG) en escena propia

Fecha: 2026-06-23
Estado: propuesta (pendiente de revisión del usuario)

## Objetivo

Recrear proceduralmente la lámpara de Pixar (Luxo) con geometrías primitivas y
CSG, siguiendo el blueprint técnico (`src/assets/luxoBlueprint*.png`), en una
**ruta/escena separada** sin tocar la escena actual (texto 3D "PIXAR" + squash).

Unidades relativas: base dome Ø = 1.0 unidad de mundo.

## Relevamiento (contexto actual)

- Vite + React 19 + TS estricto, ESM, imports nombrados, componentes funcionales.
- `main.tsx` → `<StrictMode><App/></StrictMode>`.
- `App.tsx` → `<Leva/>` + `<SquashControls/>` + `<Scene/>`. **Sin router**, una escena.
- `Scene.tsx` → `<Canvas>` envuelve `<SceneContent>`.
- Patrón de geometría existente (`PixarText`): construir geometría en `useMemo` y
  pasarla por `geometry={...}` a un `<mesh>`. El CSG imperativo seguirá ese patrón.
- `three@0.184`, `@react-three/fiber@9`, `@react-three/drei@10`, `leva@0.10`.
- **Sin lib de CSG ni router instalados.**
- `vitest.config.ts` fuerza una sola copia de three (`dedupe:['three']` +
  `mainFields:['module','browser','main']` + `inline`). Deps nuevas que usen three
  deben sumarse a ese dedupe/inline para los tests.
- `StrictMode` doble-monta en dev → CSG debe vivir en `useMemo`.

## Decisión de CSG: `three-bvh-csg` (imperativo en useMemo)

Verificado en el registry:
- `three-bvh-csg@0.0.18` → peerDeps `three >=0.179` (OK con 0.184) y
  `three-mesh-bvh >=0.9.7`.
- `@react-three/csg@4.0.0` → fija `three-mesh-bvh ^0.6.8`, **incompatible** con el
  three-bvh-csg actual (que pide >=0.9.7) y viejo para three 0.184.

Se elige **`three-bvh-csg` directo** porque:
1. Compatibilidad: evita el pin obsoleto de @react-three/csg; usa
   `three-mesh-bvh >=0.9.7` apto para three 0.184.
2. CSG corre una sola vez por `useMemo` (fuera del render).
3. Reuso/cacheo: la cabeza ranurada y la geometría de brazo se computan una vez y
   se reusan (4 brazos, 12 slots); con el `<Geometry>` declarativo recomputaría por
   instancia.
4. Consistencia con el patrón imperativo ya usado en `PixarText`.

**Instalar:** `three-bvh-csg@^0.0.18` y `three-mesh-bvh@^0.9.7`, y sumarlas al
`dedupe`/`inline` de `vitest.config.ts`.

## Montaje de la escena nueva (sin tocar la actual)

Instalar **`react-router-dom`** y envolver `App.tsx`:
- `/` → exactamente lo de hoy (`<Leva/>` + `<SquashControls/>` + `<Scene/>`).
- `/lamp` → `<LampScene/>` nueva.

Los componentes de la escena actual quedan idénticos; solo `App.tsx` agrega el
router. La escena de la lámpara monta su propio `<Canvas>` y sus propios controles
Leva.

## Jerarquía de pivots (grupos anidados, cada joint un DOF en eje Z, expuesto por ref)

```
BaseGroup (raíz, apoyada en y=0)
└─ base dome (Lathe, Ø1.0, H total 0.2) + base neck (cyl Ø0.2 × h0.15)
   └─ ShoulderJoint  ▸ shoulderRef   (rota el brazo inferior)
      └─ lower arm pair (box 2.0 × 0.2 × 0.05, ×2, gap Z 0.12)  + 1 resorte
         └─ ElbowJoint   ▸ elbowRef   (central pivot block 0.3 × 0.3 × 0.2)
            └─ upper arm pair (box 1.8 × 0.2 × 0.05, ×2, gap Z 0.12)
               └─ HeadJoint ▸ headRef  (head pivot cyl Ø0.15)
                  └─ Head: frustum (Ø0.8 ext / 0.7 int, h0.7, pared 0.025, +12 vents)
                          + reflector interno (Ø0.75 / 0.65) + bulbo
```

Cada `*Joint` es un `<group>` con `ref` nombrado (`shoulderRef`, `elbowRef`,
`headRef`) y rotación animable por props/Leva. Pose de reposo por defecto similar
al side-view (sin ángulos cotados; se ajusta con sliders).

## Medidas del blueprint (fuente única → `src/lamp/constants.ts`)

| Pieza | Medidas |
|---|---|
| Base (Weighted Dome) | Ø 1.0, **H total 0.2** (perfil Lathe redondeado, fillet ≈0.05 implícito en el perfil) |
| Base neck | cilindro Ø 0.2 × H 0.15 |
| Lower arm (par) | box 2.0 × 0.2 × 0.05, ×2, separación Z 0.12 |
| Upper arm (par) | box 1.8 × 0.2 × 0.05, ×2, separación Z 0.12 |
| Central pivot block (elbow) | **0.3 × 0.3 × 0.2** |
| Head pivot | cilindro Ø 0.15 |
| Hueco de pivote (CSG) | Ø **0.155** (0.15 + 0.005 clearance) |
| Spring | hélice: coils 12, wire Ø 0.02, Ø 0.15, **Length 0.6** — **1 sola**, decorativa, en el lower arm |
| Lamp head frustum | cono truncado Ø 0.8 ext / 0.7 int, H 0.7, pared 0.025 |
| Vent slots | 12 boxes radiales 0.1 × 0.02, restados de la cabeza |
| Inner reflector | cono truncado Ø 0.75 / 0.65 |
| Bulbo | esfera |
| Capsules (hardware) | CapsuleGeometry chica, reusada |

Nota: el blueprint mostraba "Length: 0.8" en el cluster del resorte en una vista;
por indicación del usuario el valor correcto es **0.6**.

## Piezas → geometrías (qué usa CSG)

| Pieza | Geometría base | CSG |
|---|---|---|
| Base dome | `LatheGeometry` (perfil redondeado, H 0.2) | no |
| Base neck | `CylinderGeometry` | no |
| Brazo inf./sup. | `BoxGeometry` (×2 por par) | **sí**: resta cilindros Ø0.155 (huecos de pivote); geometría reusada |
| Central pivot block | `BoxGeometry` 0.3×0.3×0.2 | opcional (hueco de eje) |
| Head pivot | `CylinderGeometry` | no |
| Spring | `TubeGeometry` sobre curva hélice | no (procedural) |
| Lamp head frustum | cono truncado | **sí**: cono ext − cono int (pared 0.025) − 12 boxes vent |
| Inner reflector | cono truncado | **sí**: Ø0.75 − Ø0.65 |
| Bulbo | `SphereGeometry` | no |
| Capsules | `CapsuleGeometry` reusada | no |

## Estructura de archivos (todo nuevo, aislado)

```
src/lamp/
  LampScene.tsx        # <Canvas> + luces + Environment + OrbitControls + <Lamp/> + Leva
  Lamp.tsx             # ensambla la jerarquía de pivots, expone refs de joints
  constants.ts         # todas las medidas del blueprint (fuente única)
  geometry/
    baseGeometry.ts        # lathe dome + neck
    armGeometry.ts         # box + CSG huecos de pivote (reusada)
    headGeometry.ts        # CSG cono hueco + 12 vents
    reflectorGeometry.ts   # CSG cono hueco interno
    springGeometry.ts      # hélice → TubeGeometry
  parts/
    Base.tsx Arm.tsx Head.tsx Spring.tsx   # componentes que consumen las geoms
```

Más: ruta `/lamp` en `App.tsx`, deps `three-bvh-csg` + `three-mesh-bvh` +
`react-router-dom`, y ajuste de `vitest.config.ts` (dedupe/inline).

## Decisiones cerradas (ambigüedades resueltas con el usuario)

1. Central pivot block = 0.3 × 0.3 × 0.2; el "0.6" era el Length del resorte.
2. Separación de boxes del par (Z) = 0.12.
3. Vent slots = 12.
4. Base = altura total 0.2 vía perfil Lathe (no cilindro+domo apilados).
5. Fillet aproximado con perfil Lathe redondeado (sin booleano).
6. Hueco de pivote = 0.155 (0.15 + 0.005 clearance).
7. Pose de reposo ≈ side-view, joints animables; sin ángulos cotados.
8. Un solo resorte decorativo, solo en el lower arm.

## Testing

- Builders de geometría son funciones puras → tests unitarios: geometría no vacía
  (`position.count > 0`), bounding box con dimensiones esperadas (p. ej. base
  Ø≈1.0, H≈0.2; arm box L≈2.0), y que el CSG produzca menos/igual volumen tras
  restar (vents/huecos presentes).
- Componentes de partes: smoke test con `@react-three/test-renderer` (montan y
  desmontan sin lanzar; cuentan meshes esperados).
- `Lamp`: smoke test que verifica la jerarquía de grupos y la existencia de los
  refs de joints.
- Sumar `three-bvh-csg` y `three-mesh-bvh` al `dedupe`/`inline` de vitest.

## Fuera de alcance

- Animación del salto/coreografía de Luxo (sub-proyecto posterior; los joints
  quedan expuestos para engancharla).
- Materiales/PBR finos, texturas, post-procesado.
- Fillet booleano real (se aproxima con Lathe).

## Criterios de éxito

- Ruta `/lamp` renderiza la lámpara ensamblada; `/` sigue idéntica e intacta.
- CSG corre una sola vez (en useMemo), no por frame.
- Geometrías repetidas (brazos, slots) reusan una geometría computada una vez.
- `npm run build`, `npm run lint`, `npm run test` pasan.
- Joints expuestos por ref y manipulables desde Leva.
```
