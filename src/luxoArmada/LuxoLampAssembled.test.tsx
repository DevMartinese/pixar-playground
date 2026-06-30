import { describe, it, expect } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { LuxoLampAssembled } from './LuxoLampAssembled'

describe('LuxoLampAssembled', () => {
  it('monta la lámpara ensamblada (foot + brazos + hinges + cabeza) sin lanzar', async () => {
    const renderer = await ReactThreeTestRenderer.create(<LuxoLampAssembled />)
    // foot + 4 links + 3 hinges + 3 rods + head + reflector + neck → varias mallas
    expect(renderer.scene.findAllByType('Mesh').length).toBeGreaterThan(8)
    await renderer.unmount()
  })
})
