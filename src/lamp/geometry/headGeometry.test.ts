import { describe, it, expect } from 'vitest'
import { buildHeadGeometry } from './headGeometry'
import { buildReflectorGeometry } from './reflectorGeometry'

describe('head/reflector geometry', () => {
  it('cabeza: Ø boca≈0.8, alto≈0.7, geometría no vacía', () => {
    const geo = buildHeadGeometry()
    geo.computeBoundingBox()
    const bb = geo.boundingBox!
    expect(bb.max.x - bb.min.x).toBeCloseTo(0.8, 1)
    expect(bb.max.y - bb.min.y).toBeCloseTo(0.7, 1)
    expect(geo.attributes.position.count).toBeGreaterThan(0)
  })

  it('reflector: geometría no vacía y más angosta que la cabeza', () => {
    const geo = buildReflectorGeometry()
    geo.computeBoundingBox()
    const bb = geo.boundingBox!
    expect(bb.max.x - bb.min.x).toBeLessThan(0.8)
    expect(geo.attributes.position.count).toBeGreaterThan(0)
  })
})
