import { LatheGeometry, Vector2 } from 'three'
import { LAMP } from '../constants'

// Domo "weighted base": perfil 2D revolucionado. Redondeo del borde aproxima el
// fillet (sin booleano). Ø total = base.diameter, alto total = base.height.
export function buildBaseDomeGeometry(): LatheGeometry {
  const r = LAMP.base.diameter / 2 // 0.5
  const h = LAMP.base.height // 0.2
  const fillet = 0.05
  // Perfil desde el centro (x=0) hacia el borde, de abajo hacia arriba.
  const points = [
    new Vector2(0, 0),
    new Vector2(r - fillet, 0),
    new Vector2(r, fillet), // borde redondeado
    new Vector2(r * 0.85, h * 0.55),
    new Vector2(r * 0.5, h * 0.9),
    new Vector2(0, h), // cúspide del domo
  ]
  return new LatheGeometry(points, 48)
}
