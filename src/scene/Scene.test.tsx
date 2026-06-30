import { describe, it, expect, vi } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { SceneContent } from './Scene'

// Environment and ContactShadows use loaders/effects that are not available
// in the jsdom test environment. Stub them out so the core light + text mesh
// can be asserted meaningfully.
vi.mock('@react-three/drei', async (importOriginal) => {
  const original = await importOriginal<typeof import('@react-three/drei')>()
  return {
    ...original,
    Environment: () => null,
    ContactShadows: () => null,
  }
})

describe('Scene', () => {
  it('monta el canvas con una luz direccional y el texto PIXAR', async () => {
    const renderer = await ReactThreeTestRenderer.create(<SceneContent />)
    expect(renderer.scene.findAllByType('DirectionalLight').length).toBeGreaterThan(0)
    expect(renderer.scene.findAllByType('Mesh').length).toBeGreaterThan(0)
    await renderer.unmount()
  })
})
