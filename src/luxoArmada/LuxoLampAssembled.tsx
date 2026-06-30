import { useEffect, useRef } from 'react'
import type { Group } from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { useControls, button } from 'leva'
import { buildLampJump } from './lampJump'
import { LuxoLampModel } from './LuxoLampModel'

// Luxo ensamblada articulable (sliders de pose) + salto (anime.js) disparable por
// Leva. Delega la jerarquía/geometría a LuxoLampModel; acá sólo van los controles
// y el grupo raíz animado por el salto.
export function LuxoLampAssembled(props: ThreeElements['group']) {
  const pose = useControls('Luxo (pose)', {
    lowerAngle: { value: 0.55, min: -1.4, max: 1.4, step: 0.01, label: 'brazo inferior' },
    elbowAngle: { value: -1.0, min: -2.2, max: 0.6, step: 0.01, label: 'codo' },
    headTilt: { value: -1, min: -1.8, max: 1.2, step: 0.01, label: 'inclinación cabeza (Z)' },
    headPitch: { value: 0, min: -3.14, max: 3.14, step: 0.01, label: 'pitch cabeza (X, mouth ↑/↓)' },
    headSpin: { value: 0, min: -3.14, max: 3.14, step: 0.01, label: 'orientación cabeza (Y)' },
  })

  // Salto (anime.js + adapter three) sobre el grupo raíz. Botón en Leva lo dispara.
  const rootRef = useRef<Group>(null)
  const jumpRef = useRef<ReturnType<typeof buildLampJump> | null>(null)
  const FOLDER = 'Salto'
  useControls(FOLDER, {
    loop: { value: false, label: 'en bucle' },
    // eslint-disable-next-line react-hooks/refs -- callback de click, no render
    '▶ saltar': button((get) => {
      const g = rootRef.current
      if (!g) return
      jumpRef.current?.revert()
      jumpRef.current = buildLampJump(g, get(`${FOLDER}.loop`))
    }),
    // eslint-disable-next-line react-hooks/refs -- callback de click, no render
    '■ parar': button(() => {
      jumpRef.current?.revert()
      jumpRef.current = null
    }),
  })
  useEffect(() => () => { jumpRef.current?.revert() }, [])

  return (
    <group ref={rootRef} {...props}>
      <LuxoLampModel pose={pose} />
    </group>
  )
}
