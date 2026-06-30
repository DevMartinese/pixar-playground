import { useEffect, useMemo, useRef } from 'react'
import type { Ref } from 'react'
import { MeshStandardMaterial, DataTexture, RGBAFormat, AdditiveBlending } from 'three'
import type { Group, Material, Object3D, SpotLight } from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { SpotLight as VolumetricSpotLight } from '@react-three/drei'
import {
  MATERIAL_COLOR,
  MATERIAL_METALNESS,
  MATERIAL_ROUGHNESS,
} from '../luxoReal/dimensions'
import { Foot } from '../luxoReal/parts/Foot'
import { Link } from '../luxoReal/parts/Link'
import { Head } from '../luxoReal/parts/Head'
import { HeadNeck } from '../luxoReal/parts/HeadNeck'
import { Reflector } from '../luxoReal/parts/Reflector'
import { Rod } from '../luxoReal/parts/Rod'
import { Bulb } from '../luxoReal/parts/Bulb'
import { DEFAULT_LAMP_POSE } from './lampPose'
import type { LampPose } from './lampPose'
import { DEFAULT_LAMP_LIGHT } from './lampLight'
import type { LampLight } from './lampLight'

// Geometría fiel (unidades base=1.0):
const NECK_TOP = 0.3 // tope del cuello del foot (pivote base)
const SEG = 0.368 // largo centro-a-centro del link (= segmento de brazo)
const ZHALF = 0.06 // medio gap entre las dos barras (par en Z)

// Textura de glow radial (blanco centro → transparente) para el halo del bulbo.
// DataTexture procedural (sin canvas) → funciona también en tests (jsdom).
function createGlowTexture(size = 64): DataTexture {
  const data = new Uint8Array(size * size * 4)
  const c = (size - 1) / 2
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - c) / c
      const dy = (y - c) / c
      const falloff = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy))
      const a = falloff * falloff // borde más suave
      const i = (y * size + x) * 4
      data[i] = 255
      data[i + 1] = 255
      data[i + 2] = 255
      data[i + 3] = Math.round(a * 255)
    }
  }
  const tex = new DataTexture(data, size, size, RGBAFormat)
  tex.needsUpdate = true
  return tex
}

// Par de barras (instancias en z=±ZHALF), agujero inferior en el origen del grupo.
function LinkPair({ material }: { material: Material }) {
  return (
    <>
      <Link material={material} position={[0, SEG / 2, ZHALF]} />
      <Link material={material} position={[0, SEG / 2, -ZHALF]} />
    </>
  )
}

// Perno del pivote centrado (asoma parejo a ambos lados).
function Pivot({ material }: { material: Material }) {
  return <Rod material={material} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.112]} />
}

// Modelo presentacional de la Luxo: jerarquía de piezas fieles en una pose dada.
// Crea sus propios materiales (gris compartido + bulbo emisivo). SIN Leva ni
// salto — eso lo agregan los consumidores (LuxoLampAssembled, JumperLamp).
export function LuxoLampModel({
  pose = DEFAULT_LAMP_POSE,
  headRef,
  tiltRef,
  lowerRef,
  light,
  ...props
}: ThreeElements['group'] & {
  pose?: LampPose
  headRef?: Ref<Group>
  tiltRef?: Ref<Group>
  lowerRef?: Ref<Group>
  light?: Partial<LampLight> // foco real que sale del bulbo (cono de luz cálida)
}) {
  const L = { ...DEFAULT_LAMP_LIGHT, ...light }
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: MATERIAL_COLOR,
        metalness: MATERIAL_METALNESS,
        roughness: MATERIAL_ROUGHNESS,
      }),
    [],
  )
  const bulbMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#fffaf0',
        emissive: '#fff2d6',
        emissiveIntensity: 2.6, // el mesh del bulbo BRILLA como fuente (no oscuro)
        roughness: 0.25,
        metalness: 0,
        toneMapped: false, // no se "apaga" con el tonemapping → blanco prendido
      }),
    [],
  )
  useEffect(
    () => () => {
      material.dispose()
      bulbMaterial.dispose()
    },
    [material, bulbMaterial],
  )

  // El spotLight apunta a un target (object3D) puesto delante de la boca (+y local):
  // así el cono de luz sale por donde mira la pantalla y sigue la cabeza.
  const spotRef = useRef<SpotLight>(null)
  const targetRef = useRef<Object3D>(null)
  useEffect(() => {
    if (spotRef.current && targetRef.current) spotRef.current.target = targetRef.current
  }, [L.on])

  // Halo/glow del bulbo (sprite aditivo, billboard).
  const glowTexture = useMemo(() => createGlowTexture(), [])
  useEffect(() => () => glowTexture.dispose(), [glowTexture])

  const { lowerAngle, elbowAngle, headTilt, headPitch, headSpin } = pose

  return (
    <group {...props}>
      {/* Base apoyada en el suelo */}
      <Foot material={material} position={[0, 0, 0]} />

      {/* Pivote base, en el tope del cuello. Rota el brazo inferior (eje Z).
          lowerRef: para que JumperLamp anime el ángulo del brazo en el salto. */}
      <group ref={lowerRef} position={[0, NECK_TOP, 0]} rotation={[0, 0, lowerAngle]}>
        <Pivot material={material} />
        <LinkPair material={material} />

        {/* Pivote central (codo) en el agujero superior del brazo inferior */}
        <group position={[0, SEG, 0]} rotation={[0, 0, elbowAngle]}>
          <Pivot material={material} />
          <LinkPair material={material} />

          {/* Pivote de cabeza (cuello) en el agujero superior del brazo superior.
              tiltRef: para que JumperLamp anime el "scaneo" del cuello por frame. */}
          <group ref={tiltRef} position={[0, SEG, 0]} rotation={[0, 0, headTilt]}>
            <Pivot material={material} />

            {/* headRef: para que JumperLamp anime el head pitch (mirada) por frame. */}
            <group ref={headRef} rotation={[headPitch, headSpin, 0]}>
              <HeadNeck material={material} position={[0, 0.0, 0]} />
              <group position={[0, 0.05, 0]}>
                <Head material={material} />
                <Reflector material={material} position={[0, 0.33, 0]} rotation={[Math.PI, 0, 0]} />
                {/* Bulbo LED dentro de la pantalla (vidrio hacia la boca). */}
                <Bulb material={bulbMaterial} position={[0, 0.5, 0]} rotation={[Math.PI, 0, 0]} />
                {/* Foco real que sale del bulbo por la boca (+y local) y sigue la
                    cabeza. SpotLight de drei = luz + cono VOLUMÉTRICO visible (rayos).
                    El target va más adelante en +y; castShadow → la pantalla recorta
                    la luz hacia atrás. El halo (sprite aditivo) lo hace brillar. */}
                {L.on && (
                  <>
                    <VolumetricSpotLight
                      ref={spotRef}
                      position={[0, 0.5, 0]}
                      angle={L.angle}
                      penumbra={L.penumbra}
                      intensity={L.intensity}
                      distance={L.distance}
                      decay={L.decay}
                      color={L.color}
                      volumetric={L.volumetric}
                      attenuation={L.coneAttenuation}
                      anglePower={L.anglePower}
                      opacity={L.coneOpacity}
                      castShadow={L.castShadow}
                      shadow-mapSize-width={1024}
                      shadow-mapSize-height={1024}
                      shadow-camera-near={0.2}
                      shadow-camera-far={L.distance}
                      shadow-bias={-0.0005}
                    />
                    <object3D ref={targetRef} position={[0, 4, 0]} />
                    {L.halo && (
                      <sprite position={[0, 0.5, 0]} scale={[L.haloSize, L.haloSize, L.haloSize]} renderOrder={2}>
                        <spriteMaterial
                          map={glowTexture}
                          color={L.color}
                          opacity={L.haloOpacity}
                          blending={AdditiveBlending}
                          transparent
                          depthWrite={false}
                          depthTest={false}
                          toneMapped={false}
                        />
                      </sprite>
                    )}
                  </>
                )}
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}
