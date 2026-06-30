import { BoxGeometry, BufferGeometry, CylinderGeometry } from 'three'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg'
import { LAMP } from '../constants'

// Cono truncado hueco con vents radiales. CylinderGeometry con radios distintos
// arriba/abajo = cono truncado. Boca ancha hacia -Y.
export function buildHeadGeometry(): BufferGeometry {
  const { outerBottomR, outerTopR, height, wall, ventCount, ventW, ventH } = LAMP.head
  const evaluator = new Evaluator()
  evaluator.attributes = ['position', 'normal']

  // outer e inner: CylinderGeometry(radiusTop, radiusBottom, height, radial)
  const outer = new Brush(new CylinderGeometry(outerTopR, outerBottomR, height, 48, 1, true))
  outer.updateMatrixWorld()
  const inner = new Brush(
    new CylinderGeometry(outerTopR - wall, outerBottomR - wall, height + 0.02, 48, 1, true),
  )
  inner.updateMatrixWorld()
  let result = evaluator.evaluate(outer, inner, SUBTRACTION)

  // Vents: boxes finos restados cerca del extremo angosto (+Y), distribuidos radial.
  const ventRadius = outerTopR + (outerBottomR - outerTopR) * 0.25 // ~cerca del top
  const ventY = height / 2 - 0.12
  for (let i = 0; i < ventCount; i++) {
    const a = (i / ventCount) * Math.PI * 2
    const slot = new Brush(new BoxGeometry(ventW, ventH, wall * 4))
    slot.position.set(Math.cos(a) * ventRadius, ventY, Math.sin(a) * ventRadius)
    slot.rotation.y = -a
    slot.updateMatrixWorld()
    result = evaluator.evaluate(result, slot, SUBTRACTION)
  }
  return result.geometry
}
