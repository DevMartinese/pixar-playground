import { CatmullRomCurve3, TubeGeometry, Vector3 } from 'three'
import { LAMP } from '../constants'

// Hélice muestreada como curva y revestida con TubeGeometry.
export function buildSpringGeometry(): TubeGeometry {
  const { coils, wireDiameter, diameter, length } = LAMP.spring
  const radius = diameter / 2
  const samplesPerCoil = 16
  const total = coils * samplesPerCoil
  const points: Vector3[] = []
  for (let i = 0; i <= total; i++) {
    const t = i / total
    const angle = t * coils * Math.PI * 2
    points.push(new Vector3(Math.cos(angle) * radius, t * length, Math.sin(angle) * radius))
  }
  const curve = new CatmullRomCurve3(points)
  return new TubeGeometry(curve, total, wireDiameter / 2, 8, false)
}
