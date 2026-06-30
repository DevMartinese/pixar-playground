import { describe, it, expect } from 'vitest'
import { MeshStandardMaterial } from 'three'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { BoxSections } from './BoxSections'

describe('BoxSections', () => {
  it('monta la placa conector (silueta) sin lanzar', async () => {
    const renderer = await ReactThreeTestRenderer.create(<BoxSections material={new MeshStandardMaterial()} />)
    expect(renderer.scene.findAllByType('Mesh').length).toBeGreaterThan(0)
    await renderer.unmount()
  })
})
