import { describe, it, expect } from 'vitest'
import { createCableSim, stepCableSim } from './cablePhysics'

const START = { x: 0, y: 10, z: 0 }
const END = { x: 0, y: 10, z: 10 } // cuerda horizontal, separación (chord) = 10

function settle(totalLength: number, steps = 400) {
  const sim = createCableSim(START, END, 14, totalLength)
  for (let i = 0; i < steps; i++) stepCableSim(sim, START, END, { gravity: 0.012 })
  return sim
}

describe('cablePhysics (cuerda verlet)', () => {
  it('con slack (largo > separación) el cable CUELGA por debajo de los extremos', () => {
    const sim = settle(15) // largo 15 > chord 10 → floja
    const mid = sim.pos[7].y
    expect(mid).toBeLessThan(9) // el medio quedó bien por debajo de y=10
  })

  it('cuando la separación supera el largo, el cable queda RECTO (tenso)', () => {
    const sim = settle(6) // largo 6 < chord 10 → no alcanza, se tensa recto
    const mid = sim.pos[7].y
    expect(mid).toBeGreaterThan(9.6) // casi sin cuelgue: pegado a la cuerda y=10
  })

  it('mantiene los extremos clavados a los anclajes', () => {
    const sim = settle(15)
    expect(sim.pos[0].z).toBeCloseTo(START.z, 5)
    expect(sim.pos[14].z).toBeCloseTo(END.z, 5)
  })
})
