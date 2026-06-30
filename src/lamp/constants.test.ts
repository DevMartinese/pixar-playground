import { describe, it, expect } from 'vitest'
import { LAMP } from './constants'

describe('LAMP constants', () => {
  it('refleja las medidas confirmadas del blueprint', () => {
    expect(LAMP.base.diameter).toBe(1.0)
    expect(LAMP.base.height).toBe(0.2)
    expect(LAMP.lowerArm.length).toBe(2.0)
    expect(LAMP.upperArm.length).toBe(1.8)
    expect(LAMP.armPairGapZ).toBe(0.12)
    expect(LAMP.pivotBlock).toEqual({ x: 0.3, y: 0.3, z: 0.2 })
    expect(LAMP.pivotHole.diameter).toBeCloseTo(0.155)
    expect(LAMP.spring).toMatchObject({ coils: 12, length: 0.6 })
    expect(LAMP.head.ventCount).toBe(12)
  })
})
