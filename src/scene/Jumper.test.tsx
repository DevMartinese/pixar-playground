import { describe, it, expect } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { Jumper } from './Jumper'

describe('Jumper', () => {
  it('monta un cilindro (Mesh) sin lanzar', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Jumper />)
    expect(renderer.scene.findAllByType('Mesh').length).toBeGreaterThan(0)
    await renderer.unmount()
  })
})
