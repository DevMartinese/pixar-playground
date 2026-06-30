// Pose articulada de la Luxo (ángulos de los joints, en radianes).
export type LampPose = {
  lowerAngle: number
  elbowAngle: number
  headTilt: number
  headPitch: number
  headSpin: number
}

// Pose por defecto (la que quedó linda en /luxo-armada).
export const DEFAULT_LAMP_POSE: LampPose = {
  lowerAngle: 0.55,
  elbowAngle: -1.0,
  headTilt: -1,
  headPitch: 0,
  headSpin: 0,
}
