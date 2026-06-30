# Diseño: Entorno base R3F + showcase de geometrías con anime.js v4

Fecha: 2026-06-22
Estado: aprobado (diseño)

## Objetivo

Preparar el entorno 3D del proyecto `pixar-lamp` sobre el template existente
(Vite + React 19 + TypeScript) e instalar el stack de render y animación. Como
base visual, montar un *showcase* que aplique las features de anime.js v4 a
geometrías 3D, para tenerlas a la vista antes de modelar la lámpara Luxo.

Este es el primer sub-proyecto. La lámpara articulada y su animación de salto
serán sub-proyectos posteriores con su propio ciclo spec → plan → implementación.

## Stack

- `three` (>= 0.150, peer dependency del adapter de anime.js)
- `@react-three/fiber` — render declarativo de three en React
- `@react-three/drei` — helpers (OrbitControls, Environment, ContactShadows)
- `animejs` v4 — motor de animación, con el adapter de three

### Decisión: three + R3F (no three nativo)

El proyecto ya es React 19 + TS. R3F permite describir la escena como JSX
declarativo y habilita drei. El adapter de anime.js opera sobre instancias de
`THREE.Object3D`, que es exactamente lo que R3F crea por debajo y expone vía
`ref`, así que anime.js funciona idéntico que con three nativo.

### Decisión: anime.js anima fuera de React

Las animaciones mutan el `Object3D` directamente cada frame; no pasan por
`setState` ni por el render loop de React. Es lo idiomático: R3F dibuja el
frame, anime.js muta los transforms. No se re-renderiza React por frame.

Convención del adapter: usa `x/y/z` (→ `.position`) y `rotateX/Y/Z` en grados
(→ `.rotation` en radianes, conversión automática). No mezclar con la API
nativa de three (radianes).

## Arquitectura

```
src/
  scene/
    Scene.tsx            # <Canvas> + entorno base (luces, env, suelo, controles)
    animeAdapter.ts      # import 'animejs/adapters/three' (side-effect, una vez)
    stations/
      SpringBox.tsx      # estacion 1
      StaggerGrid.tsx    # estacion 2
      TimelineTrio.tsx   # estacion 3
      TimerKnot.tsx      # estacion 4
      AnimatableIco.tsx  # estacion 5
      EaseRow.tsx        # estacion 6
```

- `Scene.tsx`: monta el `Canvas` de R3F con `OrbitControls`, una luz key +
  ambiente, `Environment` (preset para reflejos), `ContactShadows` y un plano de
  suelo. Coloca las estaciones repartidas en el espacio.
- Cada estación es un componente aislado: recibe una `position`, crea su(s)
  geometría(s) con `ref`, y monta su animación en un `useEffect`. Limpieza vía
  `createScope()` de anime.js (auto-revert al desmontar).
- `animeAdapter.ts` se importa una sola vez (en `Scene.tsx`) para registrar el
  adapter globalmente.

## Estaciones (qué demuestra cada una)

| # | Feature anime.js v4      | Geometría        | Comportamiento                                   |
|---|--------------------------|------------------|--------------------------------------------------|
| 1 | `animate` + `createSpring` | Box              | Rebote físico en Y con muelle, en bucle          |
| 2 | `stagger`                | Grid 5×5 de cubos | Escala/rotación escalonada en bucle              |
| 3 | `createTimeline`         | Esfera + Torus + Cono | Secuencia coreografiada encadenada          |
| 4 | `createTimer`            | TorusKnot        | Driver de tiempo → rotación continua constante   |
| 5 | `createAnimatable`       | Icosaedro        | Sigue el puntero con suavizado reactivo          |
| 6 | catálogo de `eases`      | Fila de cápsulas | Misma animación con distintas curvas en paralelo |

Cada estación usa `utils` de anime.js (random, mapRange) donde aporte variedad.

## Fuera de alcance

- Features DOM-only de anime.js que no animan un mesh: `createDraggable`,
  `onScroll`, `splitText`/`scrambleText`, SVG (`morphTo`, `createDrawable`,
  `createMotionPath`). Se mencionan pero no entran en la escena 3D.
- La lámpara Luxo (modelado y animación de salto): sub-proyectos posteriores.
- Quaternions: el adapter no los documenta; para rotaciones por eje simple no
  hacen falta. Si más adelante se necesita interpolar orientaciones complejas,
  se hará vía `useFrame` de R3F.

## Criterios de éxito

- `npm run dev` levanta la escena sin errores y con las 6 estaciones animándose.
- `npm run build` y `npm run lint` pasan limpios.
- Cada estación está en su propio archivo y se limpia al desmontar.
- El adapter de anime.js anima geometrías creadas por R3F vía `ref`.
