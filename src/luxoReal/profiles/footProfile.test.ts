import { describe, it, expect } from 'vitest'
import { FOOT_PROFILE } from './footProfile'

describe('FOOT_PROFILE', () => {
  it('rim Ø1.0 (rMax 0.5); domo + cuello limpio (alto ≈ 0.30, sin el yugo 3D)', () => {
    const rMax = Math.max(...FOOT_PROFILE.map((p) => p.x))
    const zMax = Math.max(...FOOT_PROFILE.map((p) => p.y))
    const zMin = Math.min(...FOOT_PROFILE.map((p) => p.y))
    expect(rMax).toBeCloseTo(0.5, 2)
    // Recortado al domo axisimétrico + cuello (el montaje 3D del STL no se revoluciona).
    expect(zMax - zMin).toBeCloseTo(0.3, 1)
  })
  it('starts and ends on axis (closed caps)', () => {
    expect(FOOT_PROFILE[0].x).toBeCloseTo(0, 2)
    expect(FOOT_PROFILE[FOOT_PROFILE.length - 1].x).toBeCloseTo(0, 2)
  })
})
