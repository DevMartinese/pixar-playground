import { describe, it, expect } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { MeshStandardMaterial } from 'three'
import { Foot } from './Foot'

describe('Foot', () => {
  it('mounts with at least one Mesh and no errors', async () => {
    const material = new MeshStandardMaterial()
    const renderer = await ReactThreeTestRenderer.create(<Foot material={material} />)
    const meshes = renderer.scene.findAllByType('Mesh')
    expect(meshes.length).toBeGreaterThanOrEqual(1)
    await renderer.unmount()
    material.dispose()
  })
})
