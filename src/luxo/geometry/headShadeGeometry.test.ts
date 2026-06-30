import { describe, it, expect } from 'vitest'
import { Box3 } from 'three'
import { buildHeadShadeGeometry } from './headShadeGeometry'
import { HEAD_MOUTH_OD, HEAD_HEIGHT } from '../dimensions'

describe('buildHeadShadeGeometry', () => {
  const geo = buildHeadShadeGeometry()
  geo.computeBoundingBox()
  const box = geo.boundingBox as Box3

  it('mantiene el Ø de boca y el alto del shade', () => {
    expect(box.max.x - box.min.x).toBeCloseTo(HEAD_MOUTH_OD, 2) // 0.80
    expect(box.max.y - box.min.y).toBeCloseTo(HEAD_HEIGHT, 2) // 0.70
  })

  it('genera geometría válida sin NaN (CSG hueco + 12 vents)', () => {
    const arr = geo.attributes.position.array
    expect(arr.length).toBeGreaterThan(0)
    let nan = false
    for (let i = 0; i < arr.length; i++) if (Number.isNaN(arr[i])) nan = true
    expect(nan).toBe(false)
  })

  it('no deja triángulos degenerados (área cero) tras la limpieza del CSG', () => {
    const p = geo.attributes.position.array
    let degenerate = 0
    for (let t = 0; t < p.length; t += 9) {
      const ux = p[t + 3] - p[t], uy = p[t + 4] - p[t + 1], uz = p[t + 5] - p[t + 2]
      const vx = p[t + 6] - p[t], vy = p[t + 7] - p[t + 1], vz = p[t + 8] - p[t + 2]
      const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx
      if (Math.hypot(cx, cy, cz) < 1e-9) degenerate++
    }
    expect(degenerate).toBe(0)
  })
})
