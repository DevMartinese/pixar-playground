import { describe, it, expect } from 'vitest'
import { BoxGeometry } from 'three'
import { buildArmGeometry } from './armGeometry'

describe('buildArmGeometry', () => {
  it('produce un brazo de longitud≈L con huecos (geometría no vacía)', () => {
    const geo = buildArmGeometry(2.0)
    geo.computeBoundingBox()
    const bb = geo.boundingBox!
    expect(bb.max.x - bb.min.x).toBeCloseTo(2.0, 1)
    expect(geo.attributes.position.count).toBeGreaterThan(0)
  })

  it('tiene más triángulos que un box liso (los huecos agregan geometría)', () => {
    const plain = new BoxGeometry(2.0, 0.2, 0.05)
    const arm = buildArmGeometry(2.0)
    expect(arm.attributes.position.count).toBeGreaterThan(plain.attributes.position.count)
  })
})
