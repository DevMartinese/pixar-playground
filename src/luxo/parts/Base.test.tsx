import { describe, it, expect } from 'vitest'
import { MeshStandardMaterial } from 'three'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { Base } from './Base'

describe('Base', () => {
  it('monta la malla de la base con el material dado', async () => {
    const material = new MeshStandardMaterial()
    const renderer = await ReactThreeTestRenderer.create(<Base material={material} />)
    expect(renderer.scene.findAllByType('Mesh').length).toBeGreaterThan(0)
    await renderer.unmount()
  })
})
