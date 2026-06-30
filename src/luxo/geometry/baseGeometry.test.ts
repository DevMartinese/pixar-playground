import { describe, it, expect } from 'vitest'
import { buildBaseProfile, buildBaseGeometry } from './baseGeometry'
import { BASE_RADIUS, NECK_RADIUS, DOME_HEIGHT, TOTAL_BASE_HEIGHT } from '../dimensions'

describe('buildBaseProfile', () => {
  const p = buildBaseProfile()

  it('arranca en el centro al ras del suelo (BASE POINT)', () => {
    expect(p[0].x).toBe(0)
    expect(p[0].y).toBe(0)
  })

  it('cierra arriba en el centro, al alto total (radio 0, y = TOTAL_BASE_HEIGHT)', () => {
    const last = p[p.length - 1]
    expect(last.x).toBe(0)
    expect(last.y).toBeCloseTo(TOTAL_BASE_HEIGHT)
  })

  it('el punto más ancho es el RIM APEX (radio = BASE_RADIUS)', () => {
    const maxR = Math.max(...p.map((v) => v.x))
    expect(maxR).toBeCloseTo(BASE_RADIUS)
  })

  it('incluye el NECK CONNECTION (radio del cuello a la altura del domo)', () => {
    const hit = p.some(
      (v) => Math.abs(v.x - NECK_RADIUS) < 1e-6 && Math.abs(v.y - DOME_HEIGHT) < 1e-6,
    )
    expect(hit).toBe(true)
  })

  it('sube de forma monótona en y (sin overhangs en el perfil)', () => {
    for (let i = 1; i < p.length; i++) {
      expect(p[i].y).toBeGreaterThanOrEqual(p[i - 1].y - 1e-9)
    }
  })
})

describe('buildBaseGeometry', () => {
  it('genera un LatheGeometry con vértices', () => {
    const g = buildBaseGeometry()
    expect(g.attributes.position.count).toBeGreaterThan(0)
    g.dispose()
  })
})
