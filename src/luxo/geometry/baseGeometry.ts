import { LatheGeometry, Vector2 } from 'three'
import {
  BASE_RADIUS,
  DOME_HEIGHT,
  NECK_RADIUS,
  TOTAL_BASE_HEIGHT,
  RIM_FILLET,
  BASE_RADIAL_SEGMENTS,
} from '../dimensions'

const FILLET_SEGMENTS = 6 // puntos que dibujan el redondeo del rim (sin booleano)
const DOME_SEGMENTS = 14 // puntos de la curva del domo (para que se vea suave)

// Perfil de revolución de TODA la base (domo + cuello) en una sola pieza.
// Coordenadas (x = radio, y = altura desde el suelo), ordenadas de abajo (centro)
// hacia arriba. Al revolucionar alrededor del eje Y, los puntos sobre el eje
// (x=0) en los extremos cierran las caras inferior y superior.
//
// Decisión tomada (no es un olvido): base SÓLIDA. El blueprint indica wall
// thickness 0.05 / hueca, pero como sólo se ve por fuera usamos un perfil macizo
// cerrado. Si en el futuro la queremos hueca, hay que trazar también la pared
// interior y la cara inferior anular.
export function buildBaseProfile(): Vector2[] {
  const pts: Vector2[] = []

  // BASE POINT — centro de la cara inferior, al ras del suelo (cierra el sólido).
  pts.push(new Vector2(0, 0)) // (0, 0)

  // RIM START — borde inferior-externo donde arranca el redondeo del rim.
  pts.push(new Vector2(BASE_RADIUS - RIM_FILLET, 0)) // (0.45, 0)

  // FILLET R0.05 — cuarto de círculo centrado en (BASE_RADIUS−RIM_FILLET, RIM_FILLET),
  // desde el borde inferior (−90°) hasta el punto más ancho (0°). Aproxima el
  // redondeo con varios puntos (NADA de fillet booleano).
  const cx = BASE_RADIUS - RIM_FILLET // 0.45
  const cy = RIM_FILLET // 0.05
  for (let i = 1; i <= FILLET_SEGMENTS; i++) {
    const a = -Math.PI / 2 + (Math.PI / 2) * (i / FILLET_SEGMENTS)
    pts.push(new Vector2(cx + RIM_FILLET * Math.cos(a), cy + RIM_FILLET * Math.sin(a)))
  }
  // RIM APEX — el último punto del fillet: el más ancho, radio = BASE_RADIUS.
  // (BASE_RADIUS, RIM_FILLET) = (0.5, 0.05)

  // DOME CURVE — desde RIM APEX sube y se afina hacia el cuello. El radio decae
  // con cos (queda ancho cerca del rim y cae cerca del cuello → domo "weighted")
  // y la altura va lineal desde RIM_FILLET hasta DOME_HEIGHT.
  for (let i = 1; i <= DOME_SEGMENTS; i++) {
    const t = i / DOME_SEGMENTS
    const r = NECK_RADIUS + (BASE_RADIUS - NECK_RADIUS) * Math.cos((t * Math.PI) / 2)
    const y = RIM_FILLET + (DOME_HEIGHT - RIM_FILLET) * t
    pts.push(new Vector2(r, y))
  }
  // NECK CONNECTION — el último punto del domo: donde el domo se encuentra con el
  // cuello. (NECK_RADIUS, DOME_HEIGHT) = (0.1, 0.2)

  // CUELLO — subida recta del cilindro del cuello hasta el tope.
  pts.push(new Vector2(NECK_RADIUS, TOTAL_BASE_HEIGHT)) // (0.1, 0.35)

  // TOPE — cierra la cara superior sobre el eje (radio 0, altura total).
  pts.push(new Vector2(0, TOTAL_BASE_HEIGHT)) // (0, 0.35)

  return pts
}

// LatheGeometry de la base completa, revolucionando el perfil alrededor del eje Y.
export function buildBaseGeometry(): LatheGeometry {
  return new LatheGeometry(buildBaseProfile(), BASE_RADIAL_SEGMENTS)
}
