// Dimensiones de la lámpara Luxo, en unidades relativas.
// Unidad maestra: diámetro exterior de la base = 1.0.
// Sin números mágicos sueltos: toda cota de la base vive acá.

export const BASE_DIAMETER = 1.0 // Ø exterior de la base (unidad maestra)
export const BASE_RADIUS = 0.5 // radio exterior (= punto más ancho, RIM APEX)

export const DOME_HEIGHT = 0.14 // alto del domo (real: domo más chato, ~0.13)

export const NECK_DIAMETER = 0.12 // Ø del cuello (real: cuello más fino, ~0.10)
export const NECK_RADIUS = 0.06 // radio del cuello
export const NECK_HEIGHT = 0.21 // alto del cuello (real: cuello más largo)

export const TOTAL_BASE_HEIGHT = 0.35 // alto total = DOME_HEIGHT + NECK_HEIGHT

export const RIM_FILLET = 0.05 // radio del redondeo del borde inferior (rim)

// Segmentos radiales del LatheGeometry. El domo es ancho, así que usamos un
// valor alto para que la revolución se vea suave (el brief pedía 64+).
export const BASE_RADIAL_SEGMENTS = 96

// --- Brazo: paralelogramo articulado four-bar (blueprint L-PARA-001 REV A) ---
//
// CONVENCIÓN DE PIVOTES (canónica para todo el proyecto). Paralelogramo en el
// plano XY local, 1 grado de libertad (input θ):
//
//   P2 ────────── P3      P1 = (0, 0)            esquina inf-izq, ORIGEN. Input θ.
//   /            /        P4 = (0.37, 0)         esquina inf-der.
//  /            /         P2 = P1 + L·(cosθ,sinθ)  esquina sup-izq.
// P1 ────────── P4        P3 = P4 + L·(cosθ,sinθ)  esquina sup-der (mismo θ).
//
//   P1–P4 = FIXED LINK  (barra principal inferior, "tierra", no se mueve local).
//   P2–P3 = OUTPUT LINK (barra principal superior; P3−P2 = (0.37,0) SIEMPRE →
//           orientación constante respecto del fixed link).
//   P1–P2, P4–P3 = CONTROL BARS (tie-rods, mismo ángulo θ).
//   Paralelismos: P1–P4 ∥ P2–P3 ; P1–P2 ∥ P4–P3.
//   (Nota: el blueprint img.11 rotula "fixed P1–P2"; seguimos el brief: P1–P4.)
//
// VALORES FIELES AL MODELO IMPRIMIBLE (opción a): normalizados por el foot real
// (200mm = 1.0). El foot llena el lecho de impresión, así que la lámpara queda
// compacta/patona (brazos cortos) — fiel al STL, no al Luxo de dibujo.
export const MAIN_BAR_LENGTH = 0.37 // c-c de pivotes (real: 87.6mm − ancho ≈ 73.6/200)
export const CONTROL_BAR_LENGTH = 0.12 // offset del paralelogramo (estimado del modelo)
export const MAIN_BAR_WIDTH = 0.07 // ancho de la barra (real: 14/200)
export const CONTROL_BAR_WIDTH = 0.07 // ancho del tie-rod (real: ≈ igual a la principal)
export const BAR_THICKNESS = 0.06 // espesor de la barra (real: 12/200)
export const BAR_END_RADIUS = 0.035 // radio del cap (= medio ancho)
export const PIVOT_HOLE_DIAMETER = 0.05 // Ø del pin (real ≈0.06; 0.05 deja margen de pared)
export const BAR_Z_GAP = 0.12 // doble barra en Z: z = ±0.06 (real: rod 44.8mm de largo)
export const DIAGONAL_SPRING_REST_LENGTH = 0.43 // diagonal P1→P3 a θ≈1.2
export const SPRING_COILS = 10 // vueltas del resorte
export const SPRING_WIRE_DIA = 0.01 // Ø del alambre del resorte

// --- Cabeza (lamp head) + head pivot, blueprint L-LH-001 REV A ---
export const HEAD_MOUTH_OD = 0.775 // Ø exterior de la boca (real: 154.9/200 ≈ 0.775)
export const HEAD_TOP_OD = 0.258 // Ø exterior del top (real: 51.5/200 ≈ 0.258)
export const HEAD_HEIGHT = 0.645 // alto del shade (real: 129.2/200 ≈ 0.646)
export const HEAD_WALL_THICKNESS = 0.025 // espesor de la pared del shade
export const HEAD_MOUTH_ID = 0.725 // Ø interior de la boca (= 0.775 − 2×0.025)
export const REFLECTOR_OD = 0.7 // Ø del cono reflector interior (< mouth ID 0.725)
export const REFLECTOR_WALL = 0.015 // espesor nominal del reflector (openEnded, casi no se ve)
export const REFLECTOR_GAP = 0.01 // receso del reflector respecto de la boca
export const REFLECTOR_HEIGHT = 0.65 // alto del cono reflector (≈, no en el blueprint)
export const REFLECTOR_TOP_OD = 0.18 // top angosto del reflector (≈, no en el blueprint)
export const VENT_COUNT = 12 // ranuras de ventilación
export const VENT_LENGTH = 0.1 // largo de la ranura (a lo largo de la pendiente)
export const VENT_WIDTH = 0.02 // ancho de la ranura (tangencial)
export const VENT_BC_DIAMETER = 0.22 // bolt circle nominal (ver nota: vents sobre la pared real)
export const HEAD_PIVOT_DIAMETER = 0.15 // Ø del perno del head pivot (eje Z, tilt axis)
