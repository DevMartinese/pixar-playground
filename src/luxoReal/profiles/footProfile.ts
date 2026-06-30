import { Vector2 } from 'three'
// foot_v1.stl — bbox 199.97×199.98×125.15mm — normalizado ÷199.98 (base=1.0).
// Perfil de revolución (x=radio, y=altura). SOLO el domo (parte axisimétrica real,
// puntos del STL) + un cuello limpio de cierre. El cuello irregular y el yugo/
// montura superior del STL NO son de revolución (bracket 3D con ranuras para el
// hinge) → revolucionarlos daba una forma escalonada rara; esa estructura queda
// para el ensamblado (la resuelven los hinges). Tapas en el eje (x=0).
export const FOOT_PROFILE: Vector2[] = [
  new Vector2(0.0, 0.0), // centro inferior (cierra el sólido)
  new Vector2(0.50013, 0.00391), // rim (punto más ancho)
  new Vector2(0.49996, 0.01956),
  new Vector2(0.49603, 0.0274),
  new Vector2(0.48039, 0.03522),
  new Vector2(0.47436, 0.04303),
  new Vector2(0.44782, 0.06652),
  new Vector2(0.40183, 0.09003),
  new Vector2(0.36847, 0.09784), // borde superior del domo
  new Vector2(0.28, 0.11), // hombro (cierre limpio hacia el cuello)
  new Vector2(0.18, 0.125),
  new Vector2(0.11, 0.14),
  new Vector2(0.09, 0.155), // arranque del cuello
  new Vector2(0.09, 0.3), // tope del cuello
  new Vector2(0.0, 0.3), // tapa superior (cierra el sólido)
]
