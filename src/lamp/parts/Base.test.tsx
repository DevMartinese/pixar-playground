import { describe, it, expect } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { Base } from './Base'

describe('Base', () => {
  it('monta domo + neck (2 meshes) y se desmonta sin lanzar', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Base />)
    expect(renderer.scene.findAllByType('Mesh').length).toBe(2)
    await renderer.unmount()
  })
})
