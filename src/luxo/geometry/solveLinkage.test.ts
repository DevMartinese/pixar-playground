import { describe, it, expect } from 'vitest'
import { solveLinkage } from './solveLinkage'
import { MAIN_BAR_LENGTH, CONTROL_BAR_LENGTH } from '../dimensions'

describe('solveLinkage (paralelogramo four-bar)', () => {
  it('P1 en el origen y P4 fijo en (MAIN_BAR_LENGTH, 0)', () => {
    const { p1, p4 } = solveLinkage(1.2)
    expect(p1.x).toBe(0)
    expect(p1.y).toBe(0)
    expect(p4.x).toBeCloseTo(MAIN_BAR_LENGTH)
    expect(p4.y).toBe(0)
  })

  it('el output link P2–P3 mantiene orientación (P3−P2 = (1.8, 0)) para todo θ', () => {
    for (const th of [0.3, 0.9, 1.5, 2.2, 2.8]) {
      const { p2, p3 } = solveLinkage(th)
      expect(p3.x - p2.x).toBeCloseTo(MAIN_BAR_LENGTH, 6)
      expect(p3.y - p2.y).toBeCloseTo(0, 6)
    }
  })

  it('las barras de control miden CONTROL_BAR_LENGTH (P1–P2 y P4–P3)', () => {
    const { p1, p2, p3, p4 } = solveLinkage(1.0)
    expect(Math.hypot(p2.x - p1.x, p2.y - p1.y)).toBeCloseTo(CONTROL_BAR_LENGTH, 6)
    expect(Math.hypot(p3.x - p4.x, p3.y - p4.y)).toBeCloseTo(CONTROL_BAR_LENGTH, 6)
  })

  it('paralelogramo real: P1–P2 y P4–P3 son el mismo vector', () => {
    const { p1, p2, p3, p4 } = solveLinkage(0.8)
    expect(p2.x - p1.x).toBeCloseTo(p3.x - p4.x, 6)
    expect(p2.y - p1.y).toBeCloseTo(p3.y - p4.y, 6)
  })
})
