import { describe, it, expect } from 'vitest'
import { Vector2 } from 'three'
import { ROD_PROFILE } from './rodProfile'
import { BULB_PROFILE } from './bulbProfile'
import { LED_SUPPORT_PROFILE } from './ledSupportProfile'

// Cada perfil de revolución debe matchear el bbox del STL real (÷199.98).
function dims(profile: Vector2[]) {
  const rMax = Math.max(...profile.map((p) => p.x))
  const h = Math.max(...profile.map((p) => p.y)) - Math.min(...profile.map((p) => p.y))
  return { rMax, h }
}

describe('perfiles de revolución (bbox vs STL real)', () => {
  it('rod: cilindro Ø0.06 × largo 0.224 (rods_v1)', () => {
    const { rMax, h } = dims(ROD_PROFILE)
    expect(rMax).toBeCloseTo(0.03, 2)
    expect(h).toBeCloseTo(0.224, 2)
  })
  it('bulb: Ø0.29 × alto 0.474 (buble_light_v1)', () => {
    const { rMax, h } = dims(BULB_PROFILE)
    expect(rMax).toBeCloseTo(0.145, 2)
    expect(h).toBeCloseTo(0.474, 2)
  })
  it('led_support: Ø0.10 × alto 0.469 (led_support_v1)', () => {
    const { rMax, h } = dims(LED_SUPPORT_PROFILE)
    expect(rMax).toBeCloseTo(0.05, 2)
    expect(h).toBeCloseTo(0.469, 2)
  })
})
