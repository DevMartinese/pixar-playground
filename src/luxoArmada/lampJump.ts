import { createTimeline } from 'animejs'
import type { Object3D } from 'three'
// Registra el adapter three de anime.js (animar x/y/z, scaleX/Y/Z de Object3D).
import 'animejs/adapters/three'

export type LampJumpParams = {
  hopHeight: number // altura del salto (y)
  squashY: number // aplastado (scaleY < 1)
  stretchY: number // estirado (scaleY > 1)
  squashXZ: number // ensanche (scaleX/Z > 1)
  stretchXZ: number // afinado (scaleX/Z < 1)
  anticipateMs: number // agache de anticipación
  holdMs: number // mantiene el agache un instante
  ascendMs: number // empuje + estirón hacia la cima
  hangMs: number // flota en la cima
  fallMs: number // caída acelerada
  landMs: number // aterrizaje (20% impacto / 80% recuperación elástica)
}

export const DEFAULT_LAMP_JUMP: LampJumpParams = {
  hopHeight: 0.6,
  squashY: 0.68,
  stretchY: 1.22,
  squashXZ: 1.18,
  stretchXZ: 0.9,
  anticipateMs: 260,
  holdMs: 90,
  ascendMs: 340,
  hangMs: 140,
  fallMs: 300,
  landMs: 460,
}

// Timeline de salto (estilo Luxo) sobre el grupo raíz de la lámpara, animado vía
// el adapter three de anime.js: agache (squash) → estirón al despegar → flotación
// → impacto (squash) → recuperación elástica. Salta en el lugar (no se desplaza,
// para no salirse de cuadro al repetir). La escala ocurre alrededor del origen
// (base en y=0), así la base queda apoyada al aplastarse.
export function buildLampJump(group: Object3D, loop: boolean, p: LampJumpParams = DEFAULT_LAMP_JUMP) {
  const tl = createTimeline({ loop })
  tl
    // 1. anticipación: se agacha (squash), ensancha
    .add(group, {
      scaleY: p.squashY,
      scaleX: p.squashXZ,
      scaleZ: p.squashXZ,
      ease: 'outQuad',
      duration: p.anticipateMs,
    })
    // 2. hold del agache
    .add(group, { scaleY: p.squashY, ease: 'linear', duration: p.holdMs })
    // 3. despegue + ascenso: sube + estirón
    .add(group, {
      y: p.hopHeight,
      scaleY: p.stretchY,
      scaleX: p.stretchXZ,
      scaleZ: p.stretchXZ,
      ease: 'outQuad',
      duration: p.ascendMs,
    })
    // 4. flotación en la cima: escala neutra
    .add(group, {
      scaleY: 1,
      scaleX: 1,
      scaleZ: 1,
      ease: 'inOutSine',
      duration: p.hangMs,
    })
    // 5. caída acelerada al suelo
    .add(group, { y: 0, ease: 'inQuad', duration: p.fallMs })
    // 6. impacto: squash al tocar
    .add(group, {
      scaleY: p.squashY,
      scaleX: p.squashXZ,
      scaleZ: p.squashXZ,
      ease: 'outQuad',
      duration: p.landMs * 0.2,
    })
    // 7. recuperación elástica a neutro
    .add(group, {
      scaleY: 1,
      scaleX: 1,
      scaleZ: 1,
      ease: 'outElastic',
      duration: p.landMs * 0.8,
    })
  return tl
}
