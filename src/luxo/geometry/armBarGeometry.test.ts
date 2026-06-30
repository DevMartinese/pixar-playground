import { describe, it, expect } from 'vitest'
import { Box3 } from 'three'
import { buildArmBarGeometry } from './armBarGeometry'
import {
  MAIN_BAR_LENGTH,
  MAIN_BAR_WIDTH,
  CONTROL_BAR_LENGTH,
  CONTROL_BAR_WIDTH,
  BAR_END_RADIUS,
  BAR_THICKNESS,
} from '../dimensions'

describe('buildArmBarGeometry (helper parametrizado)', () => {
  it('barra principal: largo = span + 2·cap, ancho 0.2, espesor 0.05, centrada', () => {
    const geo = buildArmBarGeometry(MAIN_BAR_LENGTH, MAIN_BAR_WIDTH)
    geo.computeBoundingBox()
    const box = geo.boundingBox as Box3
    const totalLen = MAIN_BAR_LENGTH + 2 * BAR_END_RADIUS // 2.0
    expect(box.max.y - box.min.y).toBeCloseTo(totalLen, 3)
    expect(box.min.y).toBeCloseTo(-totalLen / 2, 3) // centrada
    expect(box.max.x - box.min.x).toBeCloseTo(MAIN_BAR_WIDTH, 3)
    expect(box.max.z - box.min.z).toBeCloseTo(BAR_THICKNESS, 3)
    geo.dispose()
  })

  it('barra de control con agujero (pivote fiel Ø0.08 entra en ancho 0.1)', () => {
    // Con el pivote real Ø0.08 el agujero (radio 0.0425) entra en la control bar
    // (medio ancho 0.05) sin comerse las puntas → la barra conserva su largo.
    const geo = buildArmBarGeometry(CONTROL_BAR_LENGTH, CONTROL_BAR_WIDTH)
    geo.computeBoundingBox()
    const box = geo.boundingBox as Box3
    expect(box.max.y - box.min.y).toBeCloseTo(CONTROL_BAR_LENGTH + 2 * (CONTROL_BAR_WIDTH / 2), 3) // 0.35
    expect(box.max.x - box.min.x).toBeCloseTo(CONTROL_BAR_WIDTH, 3)
    geo.dispose()
  })
})
