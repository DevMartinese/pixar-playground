import { describe, it, expect } from 'vitest'
import type { Mesh } from 'three'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { PixarText } from './PixarText'

describe('PixarText', () => {
  it('genera una malla por letra (PIXAR = 5) con geometría no vacía', async () => {
    const renderer = await ReactThreeTestRenderer.create(<PixarText />)
    const meshes = renderer.scene.findAllByType('Mesh')
    expect(meshes.length).toBe(5)
    // Cada TextGeometry de letra debe producir vértices.
    for (const mesh of meshes) {
      const geometry = (mesh.instance as Mesh).geometry
      expect(geometry.attributes.position.count).toBeGreaterThan(0)
    }
    await renderer.unmount()
  })
})
