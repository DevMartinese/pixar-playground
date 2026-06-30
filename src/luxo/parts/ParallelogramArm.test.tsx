import { describe, it, expect } from 'vitest'
import { MeshStandardMaterial } from 'three'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { ParallelogramArm } from './ParallelogramArm'

describe('ParallelogramArm', () => {
  it('monta las 4 barras dobles + 4 pins + resorte (≥10 mallas)', async () => {
    const material = new MeshStandardMaterial()
    const renderer = await ReactThreeTestRenderer.create(
      <ParallelogramArm material={material} theta={1.2} />,
    )
    // 4 barras × 2 (doble en Z) = 8, + 4 pins + 1 resorte = 13
    expect(renderer.scene.findAllByType('Mesh').length).toBeGreaterThanOrEqual(10)
    await renderer.unmount()
  })
})
