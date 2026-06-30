import { describe, it, expect } from 'vitest'
import type { Group } from 'three'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { Lamp } from './Lamp'

describe('Lamp', () => {
  it('ensambla la lámpara (varias mallas) y aplica los ángulos de joints', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <Lamp joints={{ shoulder: 0.3, elbow: -0.4, head: 0.2 }} />,
    )
    // base(2) + lower pair(2) + spring(1) + upper pair(2) + head(3) + pivots
    expect(renderer.scene.findAllByType('Mesh').length).toBeGreaterThanOrEqual(10)
    // El ángulo del shoulder debe propagarse a un grupo de la jerarquía.
    const groups = renderer.scene.findAllByType('Group')
    const appliesShoulder = groups.some(
      (g) => Math.abs((g.instance as Group).rotation.z - 0.3) < 1e-6,
    )
    expect(appliesShoulder).toBe(true)
    await renderer.unmount()
  })
})
