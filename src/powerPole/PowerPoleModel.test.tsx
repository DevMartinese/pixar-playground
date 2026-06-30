import { describe, it, expect } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import { PowerPoleModel } from './PowerPoleModel'

describe('PowerPoleModel', () => {
  it('ensambla el poste con muchas piezas (poste + crossarms + braces + insulators)', async () => {
    const renderer = await ReactThreeTestRenderer.create(<PowerPoleModel />)
    // poste(2) + 2 crossarms(2 tablas + 3 pernos c/u) + 8 braces + 8 insulators(2 c/u)
    const meshes = renderer.scene.findAllByType('Mesh')
    expect(meshes.length).toBeGreaterThanOrEqual(30)
    await renderer.unmount()
  })
})
