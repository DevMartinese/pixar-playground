import { useMemo, useEffect } from 'react'
import { MeshStandardMaterial } from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { Post } from './parts/Post'
import { Crossarm } from './parts/Crossarm'
import { Insulator } from './parts/Insulator'
import { Strut } from './parts/Brace'
import { DEFAULT_POLE_DIMS, WOOD_COLOR, METAL_COLOR, GLASS_COLOR } from './dimensions'
import type { PoleDims } from './dimensions'

type Vec3 = [number, number, number]

// Modelo presentacional del poste de luz de madera, ensamblado por completo desde
// un `PoleDims`. Crea sus propios materiales (madera / metal / vidrio verde). Sin
// Leva — eso lo agrega el playground.
export function PowerPoleModel({
  dims = DEFAULT_POLE_DIMS,
  ...props
}: ThreeElements['group'] & { dims?: PoleDims }) {
  const wood = useMemo(
    () => new MeshStandardMaterial({ color: WOOD_COLOR, roughness: 0.85, metalness: 0 }),
    [],
  )
  const metal = useMemo(
    () => new MeshStandardMaterial({ color: METAL_COLOR, roughness: 0.4, metalness: 0.75 }),
    [],
  )
  const glass = useMemo(
    () =>
      new MeshStandardMaterial({
        color: GLASS_COLOR,
        roughness: 0.12,
        metalness: 0.1,
        transparent: true,
        opacity: 0.78,
        emissive: GLASS_COLOR,
        emissiveIntensity: 0.12,
      }),
    [],
  )
  useEffect(
    () => () => {
      wood.dispose()
      metal.dispose()
      glass.dispose()
    },
    [wood, metal, glass],
  )

  const d = dims
  const zBoard = d.postRadius + d.crossarmDepth / 2
  const insulatorX = d.crossarmLength / 2 - d.insulatorInset
  const braceTopX = d.crossarmLength / 2 - d.braceTopInset
  // Las dos alturas de crossarm (HIGH y LOW, separadas por el gap).
  const crossarmYs = [d.upperCrossarmY, d.upperCrossarmY - d.crossarmGap]

  return (
    <group {...props}>
      <Post material={wood} height={d.postHeight} radius={d.postRadius} />

      {crossarmYs.map((cy) => {
        const top = cy + d.crossarmHeight / 2 // donde se apoyan los insulators
        const braceTopY = cy - d.crossarmHeight / 2 // cara inferior del crossarm
        const braceApexY = cy - d.braceDrop // vértice de la V sobre el poste
        const insulatorPos: Vec3[] = [
          [insulatorX, top, zBoard],
          [-insulatorX, top, zBoard],
          [insulatorX, top, -zBoard],
          [-insulatorX, top, -zBoard],
        ]
        // Braces en V (frente y fondo): vértice en el poste → puntas bajo el crossarm.
        const braces: { a: Vec3; b: Vec3 }[] = [
          { a: [0, braceApexY, d.postRadius], b: [braceTopX, braceTopY, zBoard] },
          { a: [0, braceApexY, d.postRadius], b: [-braceTopX, braceTopY, zBoard] },
          { a: [0, braceApexY, -d.postRadius], b: [braceTopX, braceTopY, -zBoard] },
          { a: [0, braceApexY, -d.postRadius], b: [-braceTopX, braceTopY, -zBoard] },
        ]
        return (
          <group key={cy}>
            <Crossarm
              position={[0, cy, 0]}
              material={wood}
              boltMaterial={metal}
              length={d.crossarmLength}
              height={d.crossarmHeight}
              depth={d.crossarmDepth}
              postRadius={d.postRadius}
              boltRadius={d.boltRadius}
            />
            {braces.map((b, i) => (
              <Strut key={i} a={b.a} b={b.b} thickness={d.braceThickness} material={metal} />
            ))}
            {insulatorPos.map((p, i) => (
              <Insulator key={i} position={p} material={glass} pinMaterial={metal} scale={d.insulatorScale} />
            ))}
          </group>
        )
      })}
    </group>
  )
}
