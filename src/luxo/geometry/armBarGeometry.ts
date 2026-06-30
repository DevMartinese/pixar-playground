import {
  BufferGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Shape,
} from 'three'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg'
import { BAR_THICKNESS, PIVOT_HOLE_DIAMETER } from '../dimensions'

// Helper COMPARTIDO de la barra plana (Extrude + agujeros CSG), parametrizado por
// largo y ancho. Lo usan tanto las barras principales (ancho 0.2, span 1.8) como
// las de control (ancho 0.1, span 0.25) del paralelogramo.
const HOLE_CLEARANCE = 0.005 // holgura del corte

// Perfil 2D: rectángulo con las dos puntas redondeadas (radio = medio ancho).
// Largo sobre Y (puntas en y = ±span/2 ± cap), ancho sobre X (±width/2).
function buildBarShape(holeSpan: number, width: number): Shape {
  const halfSpan = holeSpan / 2
  const halfW = width / 2
  const cap = halfW // cap redondeado = medio ancho (R0.1 en la principal)
  const s = new Shape()
  s.moveTo(halfW, -halfSpan) // lado recto derecho, abajo
  s.lineTo(halfW, halfSpan) // sube por la derecha
  s.absarc(0, halfSpan, cap, 0, Math.PI, false) // cap superior
  s.lineTo(-halfW, -halfSpan) // baja por la izquierda
  s.absarc(0, -halfSpan, cap, Math.PI, 2 * Math.PI, false) // cap inferior
  s.closePath()
  return s
}

// Barra plana CENTRADA en el origen. `holeSpan` = distancia centro a centro de
// agujeros; el largo total es holeSpan + 2·(width/2). El llamador la memoiza y la
// instancia en z = ±0.1.
//
// `withHoles`: si true, resta los agujeros pasantes Ø0.15 con CSG real. Para las
// barras de CONTROL (ancho 0.1) el agujero Ø0.15 NO entra (radio 0.0775 > medio
// ancho 0.05), así que se construyen macizas (withHoles=false). Ver nota en
// ParallelogramArm.
export function buildArmBarGeometry(
  holeSpan: number,
  width: number,
  withHoles = true,
): BufferGeometry {
  const halfSpan = holeSpan / 2

  const extrude = new ExtrudeGeometry(buildBarShape(holeSpan, width), {
    depth: BAR_THICKNESS,
    bevelEnabled: false,
    curveSegments: 24,
  })
  extrude.translate(0, 0, -BAR_THICKNESS / 2) // centra el espesor en Z

  if (!withHoles) return extrude // barra maciza (el agujero no entra en este ancho)

  const evaluator = new Evaluator()
  evaluator.attributes = ['position', 'normal']

  let result = new Brush(extrude)
  result.updateMatrixWorld()

  const holeR = (PIVOT_HOLE_DIAMETER + HOLE_CLEARANCE) / 2
  for (const hy of [halfSpan, -halfSpan]) {
    const cyl = new CylinderGeometry(holeR, holeR, BAR_THICKNESS + 0.05, 32)
    const hole = new Brush(cyl)
    hole.rotation.x = Math.PI / 2 // eje Y → eje Z (atraviesa el plato)
    hole.position.set(0, hy, 0)
    hole.updateMatrixWorld()

    const next = evaluator.evaluate(result, hole, SUBTRACTION)
    result.geometry.dispose() // dispose de la geometría intermedia
    cyl.dispose()
    result = next
  }

  return result.geometry // centrada: agujeros en y = ±holeSpan/2
}
