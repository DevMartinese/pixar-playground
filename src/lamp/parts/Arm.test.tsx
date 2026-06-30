import { describe, it, expect } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { Arm } from './Arm'

describe('Arm', () => {
  it('renderiza el par (2 meshes con geometría compartida) sin lanzar', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Arm length={2.0} />)
    const meshes = renderer.scene.findAllByType('Mesh')
    expect(meshes.length).toBe(2)
    await renderer.unmount()
  })
})
