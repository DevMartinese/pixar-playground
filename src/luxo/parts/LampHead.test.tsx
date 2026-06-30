import { describe, it, expect } from 'vitest'
import { MeshStandardMaterial } from 'three'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { LampHead } from './LampHead'

describe('LampHead', () => {
  it('monta el shade + el reflector + el head pivot (3 mallas)', async () => {
    const material = new MeshStandardMaterial()
    const renderer = await ReactThreeTestRenderer.create(<LampHead material={material} />)
    expect(renderer.scene.findAllByType('Mesh').length).toBeGreaterThanOrEqual(3)
    await renderer.unmount()
  })
})
