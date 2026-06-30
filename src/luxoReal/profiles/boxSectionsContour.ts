import { Vector2 } from 'three'
// box_sections_v1.stl — SILUETA por convex-hull de vértices reales (best-effort, como los hinges).
// conector de secciones Agujeros internos simplificados a la silueta envolvente extruida.
export const BOX_SECTIONS_OUTER: Vector2[] = [
  new Vector2(-0.22935, -0.12825),
  new Vector2(0.04979, -0.12825),
  new Vector2(0.22822, -0.07489),
  new Vector2(0.22935, 0.04989),
  new Vector2(0.22935, 0.07489),
  new Vector2(0.05093, 0.12825),
  new Vector2(-0.22822, 0.12825),
  new Vector2(-0.22935, -0.10325),
]
export const BOX_SECTIONS_DEPTH = 0.0600
