import { describe, it, expect } from 'vitest'
import { HEAD_PROFILE } from './headProfile'

describe('HEAD_PROFILE', () => {
  it('Ø boca ≈ 0.775 (rMax 0.387) y alto ≈ 0.646 (real, head_v1)', () => {
    const rMax = Math.max(...HEAD_PROFILE.map((p) => p.x))
    const zMax = Math.max(...HEAD_PROFILE.map((p) => p.y))
    const zMin = Math.min(...HEAD_PROFILE.map((p) => p.y))
    expect(rMax).toBeCloseTo(0.387, 2)
    // perfil muestreado ≈0.638; bbox STL real 0.646 (≈1% por debajo, fiel)
    expect(zMax - zMin).toBeCloseTo(0.64, 1)
  })
  it('cuello cerrado (eje) y boca ABIERTA (último punto en el radio, no en el eje)', () => {
    expect(HEAD_PROFILE[0].x).toBeCloseTo(0, 2) // tapa del cuello
    expect(HEAD_PROFILE[HEAD_PROFILE.length - 1].x).toBeGreaterThan(0.3) // boca abierta
  })
})
