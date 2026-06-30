import { BoxGeometry, BufferGeometry, CylinderGeometry } from 'three'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg'
import { LAMP } from '../constants'

// Box del brazo con dos huecos de pivote (uno cerca de cada extremo) atravesando
// el espesor. CSG corre una vez por llamada; el llamador la memoiza.
export function buildArmGeometry(length: number): BufferGeometry {
  const { width, thickness } = LAMP.lowerArm // width/thickness comunes a ambos brazos
  const holeR = LAMP.pivotHole.diameter / 2
  const margin = 0.12 // distancia del centro del hueco al extremo

  const evaluator = new Evaluator()
  evaluator.attributes = ['position', 'normal']

  const box = new Brush(new BoxGeometry(length, width, thickness))
  box.updateMatrixWorld()

  let result = box
  for (const sign of [-1, 1] as const) {
    // Cilindro orientado a lo largo de Z (atraviesa el espesor).
    const cyl = new CylinderGeometry(holeR, holeR, thickness + 0.05, 20)
    const hole = new Brush(cyl)
    hole.rotation.x = Math.PI / 2
    hole.position.set(sign * (length / 2 - margin), 0, 0)
    hole.updateMatrixWorld()
    result = evaluator.evaluate(result, hole, SUBTRACTION)
  }
  return result.geometry
}
