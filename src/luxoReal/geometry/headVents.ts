import {
  BoxGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  Matrix4,
  Vector3,
} from 'three'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg'
import { buildRevolution } from './revolve'
import { HEAD_PROFILE } from '../profiles/headProfile'

// Number of vent slots, equally spaced every 30°.
const VENT_COUNT = 12
// Vent slot dimensions (relative units):
//   VENT_LENGTH: along the wall slope direction (~axial)
//   VENT_WIDTH: tangential (narrow slot)
//   VENT_DEPTH: radial (must pierce the wall)
const VENT_LENGTH = 0.10
const VENT_WIDTH = 0.020
const VENT_DEPTH = 0.12 // generous to guarantee a pierce

// The vent ring sits at ~80% of the profile height. From HEAD_PROFILE analysis:
//   yMin≈0.00404, yMax≈0.64222 → height≈0.6382.
//   At y≈0.55336 (index 14) r≈0.37527, at y≈0.44027 (index 13) r≈0.32314.
// We use the midpoint in that region: VENT_CENTER_Y ≈ 0.50 gives a nice ring
// on the upper-wide portion of the shade.
const VENT_CENTER_Y = 0.50

// Interpolate HEAD_PROFILE to find the outer radius at a given y.
function profileRadiusAt(y: number): number {
  const pts = HEAD_PROFILE
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].y >= y) {
      const prev = pts[i - 1]
      const curr = pts[i]
      const t = (y - prev.y) / (curr.y - prev.y)
      return prev.x + (curr.x - prev.x) * t
    }
  }
  return HEAD_PROFILE[HEAD_PROFILE.length - 1].x
}

// Compute the wall slope angle (from vertical/Y axis) at VENT_CENTER_Y.
// Uses two bracketing profile points to compute dR/dY.
function wallAngleAt(y: number): number {
  const pts = HEAD_PROFILE
  let prev = pts[0]
  let curr = pts[1]
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].y >= y) {
      prev = pts[i - 1]
      curr = pts[i]
      break
    }
  }
  // angle from Y axis: atan2(dr, dy)
  return Math.atan2(curr.x - prev.x, curr.y - prev.y)
}

// The CSG (especially the 12 fine vents) leaves degenerate triangles (area ≈ 0):
// invisible but dirty the mesh. This pass discards them (they cover zero area,
// removing them leaves no holes). Returns a new, non-indexed geometry.
// Copied from src/luxo/geometry/headShadeGeometry.ts.
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
    if (cross.length() < 1e-9) continue // degenerate triangle → discard
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

// Build the head shade: revolution of the real STL profile + 12 vent slots
// (CSG SUBTRACTION), cleaned of degenerate triangles.
// The profile's Y range is 0.00404..0.64222 (the geometry sits above Y=0).
export function buildHeadGeometry(): BufferGeometry {
  const evaluator = new Evaluator()
  evaluator.attributes = ['position', 'normal']

  // Base: lathe revolution of the real STL profile.
  const base = buildRevolution(HEAD_PROFILE)
  let result = new Brush(base)
  result.updateMatrixWorld()
  base.dispose()

  // Compute wall orientation at the vent ring height.
  const coneA = wallAngleAt(VENT_CENTER_Y) // angle from Y axis
  const rMid = profileRadiusAt(VENT_CENTER_Y)

  // Basis for each vent box:
  //   x = tangential direction (slot width)
  //   y = along-wall slope direction (slot length)
  //   z = wall-normal / radial direction (slot depth / pierce direction)
  // In the XZ plane at angle θ around Y, the radial direction at θ=0 is +X.
  // For coneA measured from Y: normal = (sin(coneA), cos(coneA), 0) → tilted outward.
  // slopeDir (along wall, upward) = (cos(coneA), -sin(coneA), 0) pointing up the slope?
  // Actually: wall goes outward+up; normal = outward component of wall.
  // For a profile point with r increasing as y increases, the outward wall normal is:
  //   normal ∝ (dY, -dR, 0) normalized = (cos(coneA), -sin(coneA), 0)... No.
  // Let's be explicit: if the wall goes in direction (dr, dy) along the profile,
  // the OUTWARD normal is (dy, -dr) rotated to 3D = (dy, -dr, 0)/|...| at θ=0.
  // For coneA = atan2(dr,dy): dr=sin(coneA), dy=cos(coneA).
  // Outward normal: (cos(coneA), -sin(coneA), 0) — points mostly outward+down.
  // Along-wall (upward along slope): (sin(coneA), cos(coneA), 0) — up and out.
  // Tangential (at θ=0, into the page): (0, 0, -1).
  const wallNormal = new Vector3(Math.cos(coneA), -Math.sin(coneA), 0)
  const slopeDir = new Vector3(Math.sin(coneA), Math.cos(coneA), 0)
  const tangent = new Vector3(0, 0, -1)
  // basis: x=tangent (width), y=slopeDir (length), z=wallNormal (depth/pierce)
  const basis = new Matrix4().makeBasis(tangent, slopeDir, wallNormal)

  for (let i = 0; i < VENT_COUNT; i++) {
    const theta = (i / VENT_COUNT) * Math.PI * 2
    const box = new BoxGeometry(VENT_WIDTH, VENT_LENGTH, VENT_DEPTH)
    // Orient perpendicular to the wall.
    box.applyMatrix4(basis)
    // Position at the wall mid-radius at the vent height.
    box.translate(rMid, VENT_CENTER_Y, 0)
    // Distribute evenly around Y axis.
    box.applyMatrix4(new Matrix4().makeRotationY(theta))

    const ventBrush = new Brush(box)
    ventBrush.updateMatrixWorld()
    const next = evaluator.evaluate(result, ventBrush, SUBTRACTION)
    result.geometry.dispose()
    box.dispose()
    result = next
  }

  // Clean degenerate triangles left by CSG and free raw geometry.
  const clean = dropDegenerateTriangles(result.geometry)
  result.geometry.dispose()
  return clean
}
