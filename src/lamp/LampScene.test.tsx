import { describe, it, expect, vi } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { LampContent } from './LampScene'

vi.mock('@react-three/drei', async (importOriginal) => {
  const original = await importOriginal<typeof import('@react-three/drei')>()
  return { ...original, Environment: () => null, ContactShadows: () => null }
})

describe('LampContent', () => {
  it('monta luz direccional + lámpara sin lanzar', async () => {
    const renderer = await ReactThreeTestRenderer.create(<LampContent />)
    expect(renderer.scene.findAllByType('DirectionalLight').length).toBeGreaterThan(0)
    expect(renderer.scene.findAllByType('Mesh').length).toBeGreaterThan(0)
    await renderer.unmount()
  })
})
