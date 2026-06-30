import { describe, it, expect } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { Head } from './Head'

describe('Head', () => {
  it('monta frustum + reflector + bulbo (3 meshes) sin lanzar', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Head />)
    expect(renderer.scene.findAllByType('Mesh').length).toBe(3)
    await renderer.unmount()
  })
})
