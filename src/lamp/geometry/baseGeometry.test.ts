import { describe, it, expect } from 'vitest'
import { buildBaseDomeGeometry } from './baseGeometry'

describe('buildBaseDomeGeometry', () => {
  it('produce un domo Ø≈1.0 y altura≈0.2 apoyado en y=0', () => {
    const geo = buildBaseDomeGeometry()
    geo.computeBoundingBox()
    const bb = geo.boundingBox!
    expect(bb.max.x - bb.min.x).toBeCloseTo(1.0, 1)
    expect(bb.min.y).toBeCloseTo(0, 2)
    expect(bb.max.y).toBeCloseTo(0.2, 1)
    expect(geo.attributes.position.count).toBeGreaterThan(0)
  })
})
