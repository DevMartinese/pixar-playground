import { describe, it, expect } from 'vitest'
import { buildSpringGeometry } from './springGeometry'

describe('buildSpringGeometry', () => {
  it('produce una hélice de altura≈0.6 y Ø≈0.15 no vacía', () => {
    const geo = buildSpringGeometry()
    geo.computeBoundingBox()
    const bb = geo.boundingBox!
    expect(bb.max.y - bb.min.y).toBeCloseTo(0.6, 1)
    expect(bb.max.x - bb.min.x).toBeCloseTo(0.15 + 0.02, 1) // Ø hélice + grosor del tubo
    expect(geo.attributes.position.count).toBeGreaterThan(0)
  })
})
