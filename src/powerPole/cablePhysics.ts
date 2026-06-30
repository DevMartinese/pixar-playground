import { Vector3 } from 'three'

// Simulación de cuerda con integración de Verlet: una cadena de partículas con
// gravedad y restricciones de distancia entre vecinas. Los extremos se "clavan"
// a los anclajes (insulators). Si la separación de los extremos supera el largo
// total del cable, las restricciones lo dejan RECTO (tenso); si no, CUELGA por
// gravedad (catenaria emergente). Pura (sin React/three-fiber) → testeable.
export type CableSim = {
  pos: Vector3[]
  prev: Vector3[]
  segments: number
  restLength: number // largo de reposo de CADA segmento (= largoTotal / segments)
}

export type Pt = { x: number; y: number; z: number }

export function createCableSim(
  start: Pt,
  end: Pt,
  segments: number,
  totalLength: number,
): CableSim {
  const pos: Vector3[] = []
  const prev: Vector3[] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const p = new Vector3(
      start.x + (end.x - start.x) * t,
      start.y + (end.y - start.y) * t,
      start.z + (end.z - start.z) * t,
    )
    pos.push(p)
    prev.push(p.clone())
  }
  return { pos, prev, segments, restLength: totalLength / segments }
}

export type StepOpts = {
  gravity?: number // empuje hacia abajo por paso
  damping?: number // 0..1 (1 = sin rozamiento)
  iterations?: number // iteraciones de restricción por paso
}

// Avanza un paso de la simulación, re-clavando los extremos a start/end.
export function stepCableSim(sim: CableSim, start: Pt, end: Pt, opts: StepOpts = {}) {
  const { pos, prev, segments, restLength } = sim
  const gravity = opts.gravity ?? 0.012
  const damping = opts.damping ?? 0.98
  const iterations = opts.iterations ?? 12

  // 1. Integración de Verlet (velocidad implícita = pos - prev) + gravedad.
  for (let i = 0; i <= segments; i++) {
    const p = pos[i]
    const pr = prev[i]
    const vx = (p.x - pr.x) * damping
    const vy = (p.y - pr.y) * damping
    const vz = (p.z - pr.z) * damping
    pr.copy(p)
    p.x += vx
    p.y += vy - gravity
    p.z += vz
  }

  // 2. Extremos clavados.
  pos[0].set(start.x, start.y, start.z)
  pos[segments].set(end.x, end.y, end.z)

  // 3. Restricciones de distancia (varias pasadas). Los extremos no se mueven.
  for (let k = 0; k < iterations; k++) {
    for (let i = 0; i < segments; i++) {
      const a = pos[i]
      const b = pos[i + 1]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dz = b.z - a.z
      const dist = Math.hypot(dx, dy, dz) || 1e-6
      const diff = (dist - restLength) / dist
      const wa = i === 0 ? 0 : 1
      const wb = i + 1 === segments ? 0 : 1
      const wsum = wa + wb
      if (wsum === 0) continue
      const fa = wa / wsum
      const fb = wb / wsum
      a.x += dx * diff * fa
      a.y += dy * diff * fa
      a.z += dz * diff * fa
      b.x -= dx * diff * fb
      b.y -= dy * diff * fb
      b.z -= dz * diff * fb
    }
    pos[0].set(start.x, start.y, start.z)
    pos[segments].set(end.x, end.y, end.z)
  }
}
