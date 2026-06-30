# Jumper: cilindro saltando (estilo Luxo)

Fecha: 2026-06-23

## Objetivo

Reemplazar la antigua lámpara articulada por un primitivo simple (cilindro) que
salta de forma notoria, usando el adapter de three.js de anime.js. Por ahora el
cilindro solo salta cruzando la escena; **todavía no** se posa sobre la "I". Es
el primer paso hacia el futuro gesto "Luxo salta sobre la I".

## Decisiones

- **Forma:** cilindro vertical. Su silueta se acerca a Luxo y el squash & stretch
  se lee claro (aplastado: ancho y bajo; estirado: alto y fino).
- **Movimiento:** saltos hacia adelante en bucle, **a lo largo de todo el texto
  PIXAR** (de la P a la R), cruzando por delante. El ancho real del texto es
  ~15.1 (borde izquierdo en x≈-7.55, derecho en x≈+7.55). Al terminar el cruce
  el timeline reinicia (vuelve a la P).
- **Ubicación:** dentro de la escena PIXAR actual (`Scene.tsx`), apoyado en el
  suelo (base en y=0), a un costado del texto. No se toca el texto ni
  `SquashControls`.

## Arquitectura

### Componente nuevo: `src/scene/Jumper.tsx`

- Renderiza un `<mesh>` con `<cylinderGeometry>`, apoyado en el suelo (la
  geometría de three centra el cilindro en su origen, así que se posiciona la
  malla en `y = altura/2` para que la base quede en 0).
- Material estilo Pixar coherente con la escena (`meshStandardMaterial`).
- `castShadow` para integrarse con `ContactShadows`.
- En un `useEffect`, crea `createTimeline({ loop: true })` (anime.js + adapter
  three, importando `./animeAdapter`) sobre la malla via `ref`. Limpia con
  `revert()` al desmontar. Mismo patrón que `SquashControls.tsx`.

### Anatomía de un salto (lo que hace que "se note")

El timeline encadena, por cada salto:

1. **Anticipación** — squash en el lugar: `scaleY ↓`, `scaleX/Z ↑`
   (conservación de volumen), `ease: inQuad`, ~150ms.
2. **Despegue + ascenso** — `y ↑` (cima del arco) + stretch `scaleY ↑`,
   `scaleX/Z ↓`; `x` avanza la mitad del paso; `ease: outQuad`.
3. **Caída** — `y ↓` al suelo, escala vuelve a neutra, `x` completa el paso;
   `ease: inQuad`.
4. **Aterrizaje** — squash de impacto y recuperación elástica; `ease: outElastic`.

El loop repite el salto avanzando en `x`. Tras N saltos (el cilindro sale de
cuadro a la derecha), el timeline reinicia y vuelve a cruzar desde la izquierda.

### Adapter (ya existente, sin cambios)

`src/scene/animeAdapter.ts` registra el adapter three de anime.js. Propiedades
animables confirmadas por sus tests: `x/y/z` (posición), `scaleX/Y/Z` (escala),
`rotateX/Y/Z` (rotación en grados).

### Integración: `src/scene/Scene.tsx`

Agregar `<Jumper />` dentro de `SceneContent`, sobre el suelo, a un costado del
texto PIXAR. Sin otros cambios.

## Parámetros (valores iniciales, ajustables)

- Altura del cilindro: ~1.2, radio: ~0.5.
- Altura de salto (`y` en la cima): ~1.5.
- Paso en `x` por salto: ~1.9; saltos antes de reiniciar: 8 (8×1.9≈15.2 ≈ ancho
  del texto, cruce de la P a la R).
- Ubicación del grupo: `position={[-7.55, 0, 1.8]}` (borde izquierdo del texto,
  al frente).
- Duraciones: anticipación ~150ms, ascenso ~300ms, caída ~250ms,
  aterrizaje/recuperación ~400ms.
- Squash: `scaleY 0.6 / scaleX-Z 1.3`. Stretch: `scaleY 1.25 / scaleX-Z 0.9`
  (~conserva volumen).

## Testing

Test vitest siguiendo el patrón de `animeAdapter.test.ts` y los `*.test.tsx`
existentes:

- Montar `Jumper` (o invocar su lógica de timeline sobre una malla three) y, tras
  `seek` a la cima del arco, verificar que `position.y` subió y que la escala
  cambió respecto al estado neutro (squash/stretch aplicado).
- Verificar que al desmontar se llama `revert()` (limpieza), si es testeable con
  el patrón actual.

## Fuera de alcance (YAGNI por ahora)

- Posarse sobre la "I" (siguiente etapa).
- Controles leva para el jumper.
- Elegir caja vs. cilindro en runtime.
