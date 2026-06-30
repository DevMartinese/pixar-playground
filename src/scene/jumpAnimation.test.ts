import { describe, it, expect } from 'vitest'
import { buildJumpTimeline, createJumpState, DEFAULT_JUMP } from './jumpAnimation'

const DEG = Math.PI / 180

describe('buildJumpTimeline', () => {
  it('se agacha y se encorva hacia adelante en la anticipación, todavía en el suelo', () => {
    const s = createJumpState()
    const tl = buildJumpTimeline(s, DEFAULT_JUMP)
    tl.pause()
    tl.seek(DEFAULT_JUMP.anticipateMs) // fin de la anticipación (agache)
    expect(s.scaleY).toBeLessThan(1) // squash vertical (se dobla)
    expect(s.scaleXZ).toBeGreaterThan(1) // ensanche horizontal
    expect(s.y).toBeCloseTo(0, 5) // aún sin despegar
    expect(s.bend).toBeGreaterThan(0) // encorvado hacia adelante (hacia donde salta)
    expect(s.bend).toBeCloseTo(DEFAULT_JUMP.bendDeg * DEG, 5) // alcanza el encorvado máximo
    tl.revert()
  })

  it('se estira, se eleva y se endereza en la cima del salto', () => {
    const s = createJumpState()
    const tl = buildJumpTimeline(s, DEFAULT_JUMP)
    tl.pause()
    // La cima llega tras agache + hold + ascenso.
    const apex = DEFAULT_JUMP.anticipateMs + DEFAULT_JUMP.holdMs + DEFAULT_JUMP.ascendMs
    tl.seek(apex)
    expect(s.y).toBeCloseTo(DEFAULT_JUMP.hopHeight)
    expect(s.scaleY).toBeGreaterThan(1) // stretch vertical
    expect(s.scaleXZ).toBeLessThan(1) // afinado horizontal
    expect(s.x).toBeGreaterThan(0) // avanzó hacia adelante
    expect(s.bend).toBeLessThan(DEFAULT_JUMP.bendDeg * DEG) // se enderezó respecto al agache
    tl.revert()
  })
})
