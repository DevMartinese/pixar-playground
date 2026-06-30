import { BufferGeometry, CylinderGeometry } from 'three'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg'
import { LAMP } from '../constants'

// Cono truncado hueco interior (reflector), Ø0.75 -> Ø0.65, pared 0.05.
export function buildReflectorGeometry(): BufferGeometry {
  const { bottomR, topR, height, wall } = LAMP.reflector
  const evaluator = new Evaluator()
  evaluator.attributes = ['position', 'normal']
  const outer = new Brush(new CylinderGeometry(topR, bottomR, height, 48, 1, true))
  outer.updateMatrixWorld()
  const inner = new Brush(new CylinderGeometry(topR - wall, bottomR - wall, height + 0.02, 48, 1, true))
  inner.updateMatrixWorld()
  return evaluator.evaluate(outer, inner, SUBTRACTION).geometry
}
