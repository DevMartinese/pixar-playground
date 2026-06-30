import { useRef, useMemo, useEffect } from 'react'
import type { ComponentRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { createCableSim, stepCableSim } from './cablePhysics'
import type { CableSim, Pt } from './cablePhysics'

// Un cable entre dos anclajes (start/end), simulado con Verlet. Lee los anclajes
// actuales cada frame (así reacciona a la separación de los postes) y actualiza
// la geometría de la línea de drei (Line2) por frame.
export function Cable({
  start,
  end,
  totalLength,
  segments,
  gravity,
  lineWidth,
  color,
}: {
  start: Pt
  end: Pt
  totalLength: number
  segments: number
  gravity: number
  lineWidth: number
  color: string
}) {
  // La sim y el buffer viven en refs (mutables por frame). Se reconstruyen si
  // cambia la cantidad de segmentos.
  const simRef = useRef<CableSim | null>(null)
  if (simRef.current === null) simRef.current = createCableSim(start, end, segments, totalLength)
  const flatRef = useRef<Float32Array | null>(null)
  if (flatRef.current === null) flatRef.current = new Float32Array((segments + 1) * 3)
  useEffect(() => {
    simRef.current = createCableSim(start, end, segments, totalLength)
    flatRef.current = new Float32Array((segments + 1) * 3)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments])

  // Puntos iniciales (sólo fijan la CANTIDAD; los valores reales los pone el 1er frame).
  const initialPoints = useMemo(
    () => Array.from({ length: segments + 1 }, () => [0, 0, 0] as [number, number, number]),
    [segments],
  )
  const lineRef = useRef<ComponentRef<typeof Line>>(null)

  useFrame(() => {
    const sim = simRef.current
    const flat = flatRef.current
    if (!sim || !flat) return
    sim.restLength = totalLength / sim.segments
    stepCableSim(sim, start, end, { gravity })
    for (let i = 0; i <= sim.segments; i++) {
      const p = sim.pos[i]
      flat[i * 3] = p.x
      flat[i * 3 + 1] = p.y
      flat[i * 3 + 2] = p.z
    }
    lineRef.current?.geometry.setPositions(flat)
  })

  return <Line ref={lineRef} points={initialPoints} lineWidth={lineWidth} color={color} />
}
