import { Vector2 } from 'three'
// head_v1.stl — bbox 154.9×154.9×129.2mm — normalizado ÷199.98 (base=1.0).
// Perfil de revolución (x=radio, y=altura) del shade real. Tapado SOLO en el cuello
// (abajo); la BOCA (arriba, radio máx) queda ABIERTA — sin tapa en el eje — para
// que la pantalla se vea hueca. La pantalla se renderiza DoubleSide.
export const HEAD_PROFILE: Vector2[] = [
  new Vector2(0.00000, 0.00404),
  new Vector2(0.12399, 0.00404),
  new Vector2(0.14723, 0.14945),
  new Vector2(0.18033, 0.17368),
  new Vector2(0.20051, 0.23831),
  new Vector2(0.19942, 0.24639),
  new Vector2(0.18657, 0.25447),
  new Vector2(0.23509, 0.31101),
  new Vector2(0.22095, 0.31909),
  new Vector2(0.25035, 0.32717),
  new Vector2(0.28190, 0.36756),
  new Vector2(0.28324, 0.37564),
  new Vector2(0.30263, 0.39988),
  new Vector2(0.32314, 0.44027),
  new Vector2(0.37527, 0.55336),
  new Vector2(0.38701, 0.63415),
  new Vector2(0.38505, 0.64222), // borde de la boca (abierta, sin tapa en el eje)
]
