import { describe, it, expect } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { MeshStandardMaterial } from 'three'
import { Bulb } from './Bulb'

describe('Bulb', () => {
  it('mounts with at least one Mesh and no errors', async () => {
    const material = new MeshStandardMaterial()
    const renderer = await ReactThreeTestRenderer.create(<Bulb material={material} />)
    const meshes = renderer.scene.findAllByType('Mesh')
    expect(meshes.length).toBeGreaterThanOrEqual(1)
    await renderer.unmount()
    material.dispose()
  })
})
