import { describe, it, expect } from 'vitest'
import { MeshStandardMaterial } from 'three'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { Links } from './Links'

describe('Links', () => {
  it('monta la placa de links (silueta) sin lanzar', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Links material={new MeshStandardMaterial()} />)
    expect(renderer.scene.findAllByType('Mesh').length).toBeGreaterThan(0)
    await renderer.unmount()
  })
})
