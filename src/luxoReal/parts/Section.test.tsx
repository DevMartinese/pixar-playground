import { describe, it, expect } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { MeshStandardMaterial } from 'three'
import { Section } from './Section'

describe('Section', () => {
  it('mounts with at least one Mesh and unmounts without error', async () => {
    const material = new MeshStandardMaterial()
    const renderer = await ReactThreeTestRenderer.create(<Section material={material} />)
    const meshes = renderer.scene.findAllByType('Mesh')
    expect(meshes.length).toBeGreaterThanOrEqual(1)
    await renderer.unmount()
    material.dispose()
  })
})
