// Config del foco (spotLight) que sale del bulbo de la Luxo. Tuneable desde el panel.
export type LampLight = {
  on: boolean
  intensity: number
  angle: number // semi-ángulo del cono (rad)
  penumbra: number // suavidad del borde (0..1)
  distance: number // alcance
  decay: number // atenuación con la distancia
  color: string
  castShadow: boolean
  // --- Rayos volumétricos (cono de luz visible en el aire) ---
  volumetric: boolean
  coneAttenuation: number // distancia a la que se desvanece el cono
  anglePower: number // suavidad del borde del cono
  coneOpacity: number // opacidad del cono visible
  // --- Halo/glow del bulbo (sprite aditivo) ---
  halo: boolean
  haloSize: number
  haloOpacity: number
}

export const DEFAULT_LAMP_LIGHT: LampLight = {
  on: true,
  intensity: 40,
  angle: 0.6,
  penumbra: 0.6,
  distance: 22,
  decay: 1.4,
  color: '#ffe7b3',
  castShadow: true,
  volumetric: true,
  coneAttenuation: 14,
  anglePower: 4,
  coneOpacity: 0.35,
  halo: true,
  haloSize: 0.8,
  haloOpacity: 0.9,
}
