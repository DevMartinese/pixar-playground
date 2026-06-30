import { describe, it, expect } from 'vitest'
import { BoxGeometry, Mesh, MeshBasicMaterial } from 'three'
import { buildJumpOntoI, createJumpState } from './jumpAnimation'

// Verifica que la coreografía "salto encima de la I" (incluido el loop de bops con
// el desfase de escala/jiggle y los offsets '<+=N') se construya sin errores.
describe('buildJumpOntoI', () => {
  it('construye el timeline con un duration > 0 (lámpara, con miradas)', () => {
    const mesh = new Mesh(new BoxGeometry(1, 1.4, 1), new MeshBasicMaterial())
    const tl = buildJumpOntoI(createJumpState(), mesh, { lookBeats: true })
    expect(tl.duration).toBeGreaterThan(0)
  })

  it('construye el timeline también para el cilindro (sin miradas)', () => {
    const mesh = new Mesh(new BoxGeometry(1, 1.4, 1), new MeshBasicMaterial())
    const tl = buildJumpOntoI(createJumpState(), mesh, { lookBeats: false })
    expect(tl.duration).toBeGreaterThan(0)
  })
})
