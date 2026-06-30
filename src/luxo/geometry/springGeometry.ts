import { BufferGeometry, CatmullRomCurve3, TubeGeometry, Vector3 } from 'three'
import {
  DIAGONAL_SPRING_REST_LENGTH,
  SPRING_COILS,
  SPRING_WIRE_DIA,
} from '../dimensions'

const COIL_RADIUS = 0.025 // radio de la hélice (decorativo, proporcional al brazo compacto)
const POINTS_PER_COIL = 16

// Resorte helicoidal de tensión: un TubeGeometry sobre una CatmullRomCurve3
// helicoidal. Va a lo largo de +Y, de 0 a REST_LENGTH (el llamador lo posiciona
// en la diagonal P1→P3 y lo estira/comprime escalando en Y según θ). Geometría
// fija; no depende de θ.
export function buildSpringGeometry(): BufferGeometry {
  const n = SPRING_COILS * POINTS_PER_COIL
  const points: Vector3[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const angle = t * SPRING_COILS * Math.PI * 2
    points.push(
      new Vector3(
        COIL_RADIUS * Math.cos(angle),
        t * DIAGONAL_SPRING_REST_LENGTH, // a lo largo de +Y
        COIL_RADIUS * Math.sin(angle),
      ),
    )
  }
  const curve = new CatmullRomCurve3(points)
  return new TubeGeometry(curve, n, SPRING_WIRE_DIA / 2, 6, false)
}
