import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import type { Mesh } from 'three'
import { useControls, button } from 'leva'
import { createTimeline } from 'animejs'
import './animeAdapter'

type Props = { target: RefObject<Mesh | null> }

const FOLDER = 'Aplastar la I'

// Controles leva (fuera del Canvas, DOM) para configurar y disparar el efecto
// "squash" de Luxo sobre la letra I: se aplasta en Y y se ensancha en X/Z
// (conservación de volumen), con recuperación elástica. Anima la malla three
// directamente vía el adapter de anime.js (scaleX/Y/Z).
//
// Los callbacks de `button(...)` se ejecutan al hacer click (event handler de
// leva), NO durante el render, así que leer refs dentro es correcto; el plugin
// react-hooks no lo distingue, de ahí los disables puntuales.
export function SquashControls({ target }: Props) {
  const animRef = useRef<ReturnType<typeof createTimeline> | null>(null)

  useControls(FOLDER, {
    squashY: { value: 0.4, min: 0.1, max: 1, step: 0.05, label: 'aplastado (Y)' },
    stretchXZ: { value: 1.35, min: 1, max: 2, step: 0.05, label: 'ensanche (X/Z)' },
    downMs: { value: 110, min: 20, max: 600, step: 10, label: 'bajada (ms)' },
    upMs: { value: 800, min: 100, max: 2500, step: 10, label: 'recuperación (ms)' },
    loop: { value: false, label: 'en bucle' },
    // eslint-disable-next-line react-hooks/refs -- callback de click, no render
    '▶ aplastar': button((get) => {
      const mesh = target.current
      if (!mesh) return
      animRef.current?.revert()
      const tl = createTimeline({ loop: get(`${FOLDER}.loop`) })
      tl.add(mesh, {
        scaleY: get(`${FOLDER}.squashY`),
        scaleX: get(`${FOLDER}.stretchXZ`),
        scaleZ: get(`${FOLDER}.stretchXZ`),
        ease: 'inQuad',
        duration: get(`${FOLDER}.downMs`),
      }).add(mesh, {
        scaleY: 1,
        scaleX: 1,
        scaleZ: 1,
        ease: 'outElastic',
        duration: get(`${FOLDER}.upMs`),
      })
      animRef.current = tl
    }),
    // eslint-disable-next-line react-hooks/refs -- callback de click, no render
    '■ parar': button(() => {
      animRef.current?.revert()
      animRef.current = null
    }),
  })

  useEffect(() => () => { animRef.current?.revert() }, [])

  return null
}
