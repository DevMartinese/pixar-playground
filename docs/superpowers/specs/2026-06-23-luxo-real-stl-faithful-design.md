# Luxo "real": rebuild procedural fiel a los STL

Fecha: 2026-06-23

## Objetivo

Reconstruir la lámpara Luxo Jr. de forma **100% procedural** (Three.js/R3F:
LatheGeometry, ExtrudeGeometry, CSG), pero **copiando la forma real** de los 23
STL del modelo imprimible (`/Users/gonzalomartinese/Downloads/luxo-jr-for-200x200mm-printer-with-led-light-model_files`),
en vez de perfiles aproximados a ojo. Se extrae el perfil/contorno exacto de
cada STL y se reproduce con geometría paramétrica.

**Aislamiento:** vive en una **ruta nueva `/luxo-real`** y una carpeta nueva
`src/luxoReal/`. El `/luxo` actual (modelo aproximado) y `src/luxo/` **no se
tocan**. `dimensions.ts` se **duplica** en `src/luxoReal/dimensions.ts` para que
sea independiente.

**Restricciones:**
- Los STL son **solo-lectura**, NO se importan al repo ni se cargan en runtime.
- Unidad maestra: ancho del `foot` = 199.98 mm = **1.0** (igual convención).
- Salida: **galería de piezas sueltas** (el ensamblado final lo hace el usuario).
- Alcance: **todas** las piezas visibles + LED (bulbo + soporte).

## Método central: "slice & rebuild"

Un **extractor offline** (Python, en el scratchpad de la sesión) corta cada malla
STL con planos y saca su forma exacta. Corre **una sola vez**; su salida se
**hornea** como datos checkeados en `src/luxoReal/profiles/`. En runtime no hay
STL: los builders procedural consumen esos puntos.

Cada pieza se clasifica en una de tres familias:

### 1. Revolución (axisimétricas)
foot, head, head_neck, reflector (parte de head), rods, rod_spacer, rod_cap,
rod_head_button, buble_light, led_support.

- Cortes horizontales (por altura) → **perfil radio-vs-altura** (polilínea de
  `Vector2`, en unidades relativas).
- Detección: para cada banda de altura, el radio debe ser ~constante alrededor
  del eje (varianza angular baja) → confirma que es revolución.
- Build: `LatheGeometry(perfil, segmentos)`.

### 2. Planas / extruidas (sección constante)
links, link_front, link_back, section_left/right, box_sections, head_cable_hide.

- **Un corte en el plano medio** perpendicular al eje de espesor → **contornos
  2D cerrados** (loop exterior + loops de agujeros).
- Detección: una dimensión (espesor) mucho menor y sección ~constante a lo largo
  de ese eje.
- Build: `THREE.Shape` (exterior) + `.holes` → `ExtrudeGeometry`. Los agujeros
  reales salen del corte (no se inventan); si el slicing de agujeros falla, se
  restan por CSG con el Ø medido.

### 3. Complejas (3D no trivial)
hinge_{bottom,middle,top}_{left,right}.

- Se extrae la **silueta dominante** (contorno en su vista principal) + features
  medidos (agujeros, Ø de pin). Donde la forma no cierre exacta con extrude, se
  aproxima y se **marca en el código** el límite de fidelidad.

### Features sobre revoluciones
Lo que un perfil de revolución no puede tener (vents de la cabeza, agujeros de
pivote) se agrega con **CSG encima**, con posiciones/cantidad **medidas del STL
real** (p. ej. los 12 vents de la cabeza, su altura y bolt circle reales).

## Arquitectura (`src/luxoReal/`)

- `dimensions.ts` — copia independiente; unidad maestra base=1.0. Se irá
  ajustando con las medidas reales por pieza.
- `profiles/` — datos extraídos, 1 archivo por pieza (ej. `footProfile.ts`
  exporta `Vector2[]` del perfil de revolución; `linkContour.ts` exporta el
  contorno 2D + agujeros). Comentario en cada archivo: de qué STL salió, bbox
  real (mm) y unidad de normalización.
- `geometry/` — builders puros que consumen los perfiles:
  - `revolve.ts` — `buildRevolution(profile, segments)` → LatheGeometry.
  - `extrudeContour.ts` — `buildExtruded(contour, holes, depth)` → ExtrudeGeometry.
  - builders específicos donde haga falta CSG de features.
- `parts/` — componentes R3F por pieza (Foot, Head, HeadNeck, CableHide, Link,
  Section, Hinge*, Rod, RodSpacer, RodCap, RodButton, Bulb, LedSupport).
- `LuxoRealGallery.tsx` — material gris compartido (mismo estilo), dispone todas
  las piezas sueltas lado a lado.
- `LuxoRealPlayground.tsx` — Canvas (mismo color/luz que PIXAR/luxo), cámara
  encuadrando la galería.
- Ruta `/luxo-real` + link "Luxo real" en `App.tsx` (sin tocar `/luxo`).

## Pipeline de extracción (offline, scratchpad)

`stl_extract.py` (en scratchpad):
1. Parsea STL binario (struct, sin numpy).
2. Clasifica cada pieza (revolución / plana / compleja) por sus proporciones y
   varianza.
3. Emite el perfil/contorno en **unidades relativas** (÷199.98) a JSON.
4. Reporta una tabla por pieza: familia, bbox real, nº de puntos del perfil.

Se revisa la salida, se **simplifica** (decimar puntos casi colineales) y se
hornea a `src/luxoReal/profiles/*.ts`. La malla STL nunca entra al repo.

## Orden de implementación (por familias, pieza por pieza)

1. **Andamiaje:** ruta `/luxo-real`, carpeta, `dimensions.ts`, playground +
   galería vacía, material compartido. Builders genéricos `revolve` / `extrudeContour`.
2. **Revolución base:** foot (perfil real) → la pieza ancla.
3. **Cabeza:** head (perfil real) + vents CSG con posiciones reales; head_neck;
   head_cable_hide; reflector.
4. **Planas:** links / sections (contorno real + agujeros).
5. **Pivotería:** rods, spacer, cap, button (revoluciones chicas).
6. **Hinges:** bottom/middle/top (silueta + features, best-effort).
7. **LED:** buble_light, led_support.
8. **Cierre:** galería completa, verificación bbox de cada pieza vs STL real,
   lint/build.

## Testing

- Cada perfil horneado: test que su bbox (derivado de los puntos) matchea el bbox
  real del STL (tolerancia chica).
- Cada builder: la geometría generada respeta las dimensiones del perfil.
- Cada componente: monta sin lanzar y rinde las mallas esperadas (test-renderer).
- Features CSG (vents, agujeros): verificación de corte real (raycast) como en
  la cabeza/brazos actuales, y limpieza de triángulos degenerados.

## Fuera de alcance (YAGNI)

- Ensamblar la lámpara completa (lo hace el usuario).
- Importar/renderizar las mallas STL crudas.
- Texturas/materiales PBR avanzados (un solo gris metálico compartido).
- Tocar `/luxo`, `src/luxo/`, o la escena PIXAR.

## Riesgos / cosas a marcar

- **Hinges:** forma 3D compleja; la extrusión de silueta puede no ser exacta —
  se marca el límite y se ofrece refinar.
- **Agujeros por slicing:** si el corte 2D no captura bien los agujeros, fallback
  a CSG con Ø medido.
- **foot con yugo/LED interno:** el STL tiene estructura interna (cavidades,
  columna LED). El perfil de revolución externo se reproduce; las cavidades
  internas se omiten salvo que se pidan.
- **Proporción patona:** el foot llena el lecho 200mm → la lámpara real es
  compacta. Se respeta (es el modelo real).
