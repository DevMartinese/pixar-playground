import { Vector2 } from 'three'
// links_v1.stl — SILUETA por convex-hull de vértices reales (best-effort, como los hinges).
// placa de links Agujeros internos simplificados a la silueta envolvente extruida.
export const LINKS_OUTER: Vector2[] = [
  new Vector2(-0.12085, -0.21897),
  new Vector2(-0.05085, -0.21897),
  new Vector2(0.12085, -0.21682),
  new Vector2(0.12085, 0.21682),
  new Vector2(-0.05085, 0.21897),
  new Vector2(-0.12085, 0.21897),
]
export const LINKS_DEPTH = 0.0600
