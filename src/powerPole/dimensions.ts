// Medidas del poste de luz de madera (tuneables desde el panel). Unidades del
// blueprint: alto 20, ancho de crossarm 8, gap entre crossarms 4. El poste se
// apoya con la base en y=0 y crece en +Y; los crossarms van en X, frente/fondo en Z.
export type PoleDims = {
  postHeight: number // alto del poste (cilindro)
  postRadius: number // radio del poste
  crossarmLength: number // largo del crossarm (en X) = "WIDTH"
  crossarmHeight: number // alto de la tabla del crossarm (en Y)
  crossarmDepth: number // espesor de cada tabla (en Z)
  upperCrossarmY: number // altura del crossarm superior (HIGH)
  crossarmGap: number // separación vertical al crossarm inferior (LOW)
  insulatorScale: number // escala de los insulators de vidrio
  insulatorInset: number // cuánto entran los insulators desde la punta del crossarm
  braceThickness: number // grosor de los braces diagonales
  braceDrop: number // cuánto baja el vértice de la V del brace sobre el poste
  braceTopInset: number // dónde se apoya el brace bajo el crossarm (desde la punta)
  boltRadius: number // radio de los pernos
}

// Colores/materiales base (estilo del proyecto).
export const WOOD_COLOR = '#8a6a45'
export const METAL_COLOR = '#8b8d92'
export const GLASS_COLOR = '#5aa86a'

// Puntos de anclaje LOCALES de los cables: el surco/tope de cada insulator (8 en
// total: 2 crossarms × 4 insulators). Devuelve [x, y, z] relativos al poste.
export function insulatorAnchors(d: PoleDims): [number, number, number][] {
  const zBoard = d.postRadius + d.crossarmDepth / 2
  const x = d.crossarmLength / 2 - d.insulatorInset
  const crossarmYs = [d.upperCrossarmY, d.upperCrossarmY - d.crossarmGap]
  const anchors: [number, number, number][] = []
  for (const cy of crossarmYs) {
    const ay = cy + d.crossarmHeight / 2 + 0.6 * d.insulatorScale // surco del insulator
    for (const sx of [x, -x]) for (const sz of [zBoard, -zBoard]) anchors.push([sx, ay, sz])
  }
  return anchors
}

export const DEFAULT_POLE_DIMS: PoleDims = {
  postHeight: 20,
  postRadius: 0.4,
  crossarmLength: 8,
  crossarmHeight: 0.5,
  crossarmDepth: 0.45,
  upperCrossarmY: 17.5,
  crossarmGap: 4,
  insulatorScale: 0.9,
  insulatorInset: 0.9,
  braceThickness: 0.13,
  braceDrop: 1.8,
  braceTopInset: 1.2,
  boltRadius: 0.09,
}
