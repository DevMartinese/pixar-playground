import { LatheGeometry, Vector2 } from 'three'

const DEFAULT_SEGMENTS = 96

// Revoluciona un perfil 2D (x=radio, y=altura) alrededor del eje Y. El perfil
// debe venir ordenado de abajo hacia arriba; puntos en x=0 cierran las tapas.
export function buildRevolution(profile: Vector2[], segments: number = DEFAULT_SEGMENTS): LatheGeometry {
  return new LatheGeometry(profile, segments)
}
