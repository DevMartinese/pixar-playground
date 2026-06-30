import { describe, it, expect } from 'vitest'
import { Box3 } from 'three'
import { buildHeadGeometry } from './headVents'

describe('buildHeadGeometry', () => {
  // Build once and reuse across tests (expensive CSG).
  const geo = buildHeadGeometry()

  it('bounding box Ø ≈ 0.775 (rMax≈0.387, real head_v1 154.9mm/199.98)', () => {
    geo.computeBoundingBox()
    const b = geo.boundingBox as Box3
    const diameter = b.max.x - b.min.x
    expect(diameter).toBeCloseTo(0.775, 2)
  })

  it('bounding box height ≈ 0.642 (real head_v1 128.4mm/199.98)', () => {
    geo.computeBoundingBox()
    const b = geo.boundingBox as Box3
    const height = b.max.y - b.min.y
    expect(height).toBeCloseTo(0.642, 2)
  })

  it('has no degenerate triangles (cross-product area > 1e-9)', () => {
    const p = geo.attributes.position.array
    let degenerate = 0
    for (let t = 0; t < p.length; t += 9) {
      const ux = p[t + 3] - p[t]
      const uy = p[t + 4] - p[t + 1]
      const uz = p[t + 5] - p[t + 2]
      const vx = p[t + 6] - p[t]
      const vy = p[t + 7] - p[t + 1]
      const vz = p[t + 8] - p[t + 2]
      const cx = uy * vz - uz * vy
      const cy = uz * vx - ux * vz
      const cz = ux * vy - uy * vx
      if (Math.hypot(cx, cy, cz) < 1e-9) degenerate++
    }
    expect(degenerate).toBe(0)
  })

  it('generates valid geometry with no NaN vertices', () => {
    const arr = geo.attributes.position.array
    expect(arr.length).toBeGreaterThan(0)
    let nan = false
    for (let i = 0; i < arr.length; i++) if (Number.isNaN(arr[i])) nan = true
    expect(nan).toBe(false)
  })
})
