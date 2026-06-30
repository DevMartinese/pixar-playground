import { describe, it, expect } from 'vitest'
import { Vector2, Box3 } from 'three'
import { buildExtruded } from './extrudeContour'

describe('buildExtruded', () => {
  it('extruye un contorno con su espesor y conserva el bbox 2D', () => {
    const outer = [new Vector2(-0.5, -0.25), new Vector2(0.5, -0.25), new Vector2(0.5, 0.25), new Vector2(-0.5, 0.25)]
    const geo = buildExtruded(outer, [], 0.1)
    geo.computeBoundingBox()
    const b = geo.boundingBox as Box3
    expect(b.max.x - b.min.x).toBeCloseTo(1.0, 3)
    expect(b.max.y - b.min.y).toBeCloseTo(0.5, 3)
    expect(b.max.z - b.min.z).toBeCloseTo(0.1, 3) // espesor centrado
    geo.dispose()
  })
})
