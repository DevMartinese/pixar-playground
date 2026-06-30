// Fuente única de medidas del blueprint Luxo (unidades relativas, base Ø=1.0).
// Valores confirmados con el usuario; los marcados "(aprox.)" no están cotados
// en el plano y se afinan visualmente.
export const LAMP = {
  base: { diameter: 1.0, height: 0.2 }, // perfil Lathe redondeado
  neck: { diameter: 0.2, height: 0.15 },
  lowerArm: { length: 2.0, width: 0.2, thickness: 0.05 },
  upperArm: { length: 1.8, width: 0.2, thickness: 0.05 },
  armPairGapZ: 0.12, // separación entre los 2 boxes del par (eje Z)
  pivotBlock: { x: 0.3, y: 0.3, z: 0.2 }, // central pivot block (elbow)
  headPivot: { diameter: 0.15 },
  pivotHole: { diameter: 0.155 }, // 0.15 + 0.005 clearance para el CSG
  spring: { coils: 12, wireDiameter: 0.02, diameter: 0.15, length: 0.6 },
  head: {
    outerBottomR: 0.4, // Ø0.8 boca (abajo)
    outerTopR: 0.2, // (aprox.) extremo angosto del cono
    height: 0.7,
    wall: 0.025,
    ventCount: 12,
    ventW: 0.1,
    ventH: 0.02,
  },
  reflector: {
    bottomR: 0.375, // Ø0.75
    topR: 0.19, // (aprox.) dentro de la cabeza
    height: 0.6, // (aprox.)
    wall: 0.05, // Ø0.75 - Ø0.65
  },
  bulb: { radius: 0.12 },
  capsule: { radius: 0.03, length: 0.16 },
} as const
