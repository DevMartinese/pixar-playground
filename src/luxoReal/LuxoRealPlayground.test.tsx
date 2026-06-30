import { describe, it, expect, vi } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { LuxoRealPlaygroundContent } from './LuxoRealPlayground'

vi.mock('@react-three/drei', async (importOriginal) => {
  const original = await importOriginal<typeof import('@react-three/drei')>()
  return { ...original, Environment: () => null, ContactShadows: () => null }
})

describe('LuxoRealPlaygroundContent', () => {
  it('monta la base de la escena (luz direccional) sin lanzar', async () => {
    const renderer = await ReactThreeTestRenderer.create(<LuxoRealPlaygroundContent />)
    expect(renderer.scene.findAllByType('DirectionalLight').length).toBeGreaterThan(0)
    await renderer.unmount()
  })
})
