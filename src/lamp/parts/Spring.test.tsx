import { describe, it, expect } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { Spring } from './Spring'

describe('Spring', () => {
  it('monta un mesh y se desmonta sin lanzar', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Spring />)
    expect(renderer.scene.findAllByType('Mesh').length).toBe(1)
    await renderer.unmount()
  })
})
