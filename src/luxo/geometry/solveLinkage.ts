import { Vector2 } from 'three'
import { MAIN_BAR_LENGTH, CONTROL_BAR_LENGTH } from '../dimensions'

export type Linkage = { p1: Vector2; p2: Vector2; p3: Vector2; p4: Vector2 }

// Cinemática del paralelogramo four-bar (1 grado de libertad). El único input es
// θ (ángulo de las barras de control respecto del fixed link P1–P4). Las 4
// posiciones se DERIVAN por restricción — no son ángulos independientes:
//
//   P1 = (0, 0)                              input, origen
//   P4 = (MAIN_BAR_LENGTH, 0)                fixed link con P1
//   P2 = P1 + CONTROL_BAR_LENGTH·(cosθ,sinθ) control izq
//   P3 = P4 + CONTROL_BAR_LENGTH·(cosθ,sinθ) control der (MISMO θ)
//
// Como P2 y P3 se desplazan con el mismo vector, P3−P2 = P4−P1 = (1.8,0) siempre
// → el output link P2–P3 mantiene orientación constante al plegar/desplegar.
export function solveLinkage(theta: number): Linkage {
  const dx = CONTROL_BAR_LENGTH * Math.cos(theta)
  const dy = CONTROL_BAR_LENGTH * Math.sin(theta)
  return {
    p1: new Vector2(0, 0),
    p4: new Vector2(MAIN_BAR_LENGTH, 0),
    p2: new Vector2(dx, dy),
    p3: new Vector2(MAIN_BAR_LENGTH + dx, dy),
  }
}
