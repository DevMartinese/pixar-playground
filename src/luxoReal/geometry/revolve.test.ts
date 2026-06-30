import { describe, it, expect } from 'vitest'
import { Vector2, Box3 } from 'three'
import { buildRevolution } from './revolve'

describe('buildRevolution', () => {
  it('revoluciona un perfil y respeta radio/alto', () => {
    const profile = [new Vector2(0, 0), new Vector2(0.5, 0), new Vector2(0.5, 1), new Vector2(0, 1)]
    const geo = buildRevolution(profile, 64)
    geo.computeBoundingBox()
    const b = geo.boundingBox as Box3
    expect(b.max.x - b.min.x).toBeCloseTo(1.0, 2) // Ø = 2·radio
    expect(b.max.y - b.min.y).toBeCloseTo(1.0, 2)
    geo.dispose()
  })
})
