import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  Matrix4,
  Vector3,
} from 'three'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg'
import {
  HEAD_MOUTH_OD,
  HEAD_TOP_OD,
  HEAD_HEIGHT,
  HEAD_WALL_THICKNESS,
  VENT_COUNT,
  VENT_LENGTH,
  VENT_WIDTH,
} from '../dimensions'

const MOUTH_R = HEAD_MOUTH_OD / 2 // 0.40 — radio exterior abajo (boca)
const TOP_R = HEAD_TOP_OD / 2 // 0.125 — radio exterior arriba (top)
const INNER_MOUTH_R = MOUTH_R - HEAD_WALL_THICKNESS // 0.375
const INNER_TOP_R = TOP_R - HEAD_WALL_THICKNESS // 0.10
const RAD_SEG = 64 // segmentos radiales (cono suave + cortes limpios)

const VENT_DEPTH = 0.1 // profundidad del corte (≫ pared 0.025, atraviesa)
const VENT_CENTER_Y = 0.24 // altura del centro de los vents (zona alta del cono)

// Semiángulo de la pared del cono respecto de la vertical (~21.5°).
const CONE_A = Math.atan2(MOUTH_R - TOP_R, HEAD_HEIGHT)

// Radio exterior del cono a una altura y ∈ [−H/2, +H/2].
function rOuterAt(y: number): number {
  const t = (y + HEAD_HEIGHT / 2) / HEAD_HEIGHT
  return MOUTH_R + (TOP_R - MOUTH_R) * t
}

// El CSG (sobre todo los 12 vents finos) deja triángulos degenerados (área ≈ 0):
// invisibles pero ensucian la malla. Esta pasada los descarta (cubren área cero,
// sacarlos no abre huecos). Devuelve una geometría nueva, no indexada.
function dropDegenerateTriangles(geo: BufferGeometry): BufferGeometry {
  const pos = geo.attributes.position
  const nrm = geo.attributes.normal
  const index = geo.index
  const triCount = index ? index.count / 3 : pos.count / 3
  const keepPos: number[] = []
  const keepNrm: number[] = []
  const a = new Vector3()
  const b = new Vector3()
  const c = new Vector3()
  const ab = new Vector3()
  const ac = new Vector3()
  const cross = new Vector3()
  for (let t = 0; t < triCount; t++) {
    const i0 = index ? index.getX(t * 3) : t * 3
    const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1
    const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2
    a.fromBufferAttribute(pos, i0)
    b.fromBufferAttribute(pos, i1)
    c.fromBufferAttribute(pos, i2)
    cross.crossVectors(ab.subVectors(b, a), ac.subVectors(c, a))
    if (cross.length() < 1e-9) continue // triángulo degenerado → descartar
    for (const idx of [i0, i1, i2]) {
      keepPos.push(pos.getX(idx), pos.getY(idx), pos.getZ(idx))
      if (nrm) keepNrm.push(nrm.getX(idx), nrm.getY(idx), nrm.getZ(idx))
    }
  }
  const out = new BufferGeometry()
  out.setAttribute('position', new Float32BufferAttribute(keepPos, 3))
  if (nrm) out.setAttribute('normal', new Float32BufferAttribute(keepNrm, 3))
  return out
}

// Cabeza/shade: frustum hueco (CSG: exterior sólido − interior) con 12 ranuras
// de ventilación pasantes (CSG: − 12 boxes finos). TODO en un solo armado; el
// llamador lo memoiza. Centrado en el origen (y ∈ [−0.35, 0.35]).
export function buildHeadShadeGeometry(): BufferGeometry {
  const evaluator = new Evaluator()
  evaluator.attributes = ['position', 'normal']

  // --- 1. Shade hueco: frustum exterior sólido − frustum interior ---
  const outer = new CylinderGeometry(TOP_R, MOUTH_R, HEAD_HEIGHT, RAD_SEG)

  // Interior con la misma pendiente de pared pero extendido 0.05 por cada
  // extremo, para atravesar limpio boca y top (evita caras coplanares en las
  // tapas → menos artefactos CSG). Resultado: pared real de 0.025, hueco.
  const margin = 0.05
  const slope = (INNER_TOP_R - INNER_MOUTH_R) / HEAD_HEIGHT // pendiente del radio interior
  const innerRb = INNER_MOUTH_R + slope * -margin // radio en y = −(H/2+margin)
  const innerRt = INNER_MOUTH_R + slope * (HEAD_HEIGHT + margin) // radio en y = +(H/2+margin)
  const inner = new CylinderGeometry(innerRt, innerRb, HEAD_HEIGHT + 2 * margin, RAD_SEG)

  const outerBrush = new Brush(outer)
  outerBrush.updateMatrixWorld()
  const innerBrush = new Brush(inner)
  innerBrush.updateMatrixWorld()

  let result = evaluator.evaluate(outerBrush, innerBrush, SUBTRACTION)
  outer.dispose() // dispose de las geos intermedias del hueco
  inner.dispose()

  // --- 2. Vents: 12 boxes finos restados, equiespaciados cada 30° ---
  // Cada box se orienta con su profundidad a lo largo de la NORMAL de la pared
  // (perpendicular al corte), su largo a lo largo de la pendiente y su ancho
  // tangencial; luego se rota alrededor de Y para distribuirlo.
  const normal = new Vector3(Math.cos(CONE_A), Math.sin(CONE_A), 0)
  const slopeDir = new Vector3(-Math.sin(CONE_A), Math.cos(CONE_A), 0)
  const tangent = new Vector3(0, 0, -1)
  const basis = new Matrix4().makeBasis(tangent, slopeDir, normal) // x=ancho, y=largo, z=prof
  const rMid = rOuterAt(VENT_CENTER_Y) - HEAD_WALL_THICKNESS / 2 // centro del corte en la pared

  for (let i = 0; i < VENT_COUNT; i++) {
    const theta = (i / VENT_COUNT) * Math.PI * 2
    const box = new BoxGeometry(VENT_WIDTH, VENT_LENGTH, VENT_DEPTH)
    box.applyMatrix4(basis) // orienta perpendicular a la pared
    box.translate(rMid, VENT_CENTER_Y, 0) // lo apoya en la pared (lado +X)
    box.applyMatrix4(new Matrix4().makeRotationY(theta)) // distribuye cada 30°

    const ventBrush = new Brush(box)
    ventBrush.updateMatrixWorld()
    const next = evaluator.evaluate(result, ventBrush, SUBTRACTION)
    result.geometry.dispose() // dispose de la geometría intermedia (shade o vent previo)
    box.dispose()
    result = next
  }

  // Limpia los triángulos degenerados que dejó el CSG y libera la geo cruda.
  const clean = dropDegenerateTriangles(result.geometry)
  result.geometry.dispose()
  return clean
}
