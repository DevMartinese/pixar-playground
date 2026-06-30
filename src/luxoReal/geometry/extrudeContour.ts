import { BufferGeometry, ExtrudeGeometry, Path, Shape, Vector2 } from 'three'

// Construye una pieza plana: contorno exterior + agujeros, extruido `depth` en Z
// y centrado en Z. Contornos en el plano XY (unidades relativas).
export function buildExtruded(outer: Vector2[], holes: Vector2[][], depth: number): BufferGeometry {
  const shape = new Shape(outer)
  for (const h of holes) {
    const path = new Path(h)
    shape.holes.push(path)
  }
  const geo = new ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 24 })
  geo.translate(0, 0, -depth / 2)
  return geo
}
