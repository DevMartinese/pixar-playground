import { describe, it, expect } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { MeshStandardMaterial } from 'three'
import { HingeTop } from './HingeTop'

describe('HingeTop', () => {
  it('mounts with at least one Mesh and unmounts without error', async () => {
    const material = new MeshStandardMaterial()
    const renderer = await ReactThreeTestRenderer.create(<HingeTop material={material} />)
    const meshes = renderer.scene.findAllByType('Mesh')
    expect(meshes.length).toBeGreaterThanOrEqual(1)
    await renderer.unmount()
    material.dispose()
  })
})
