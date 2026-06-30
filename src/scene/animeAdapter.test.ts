import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { animate } from 'animejs'
import './animeAdapter'

describe('anime.js three adapter', () => {
  it('anima la posición de un Object3D via la convención x/y/z', () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial())
    const anim = animate(mesh, { x: 5, y: -3, z: 2, duration: 100 })
    anim.seek(anim.duration) // saltar al final
    expect(mesh.position.x).toBeCloseTo(5)
    expect(mesh.position.y).toBeCloseTo(-3)
    expect(mesh.position.z).toBeCloseTo(2)
    anim.revert()
  })

  // Regresión: rotateX/Y/Z van en grados y se convierten a radianes. Esta ruta
  // es la que se rompía cuando vitest cargaba dos copias de three (instanceof
  // fallaba y rotateX caía al método nativo de Object3D -> crash str.includes).
  it('convierte rotateX/Y/Z de grados a radianes', () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial())
    const anim = animate(mesh, { rotateX: 90, rotateZ: 180, duration: 100 })
    anim.seek(anim.duration)
    expect(mesh.rotation.x).toBeCloseTo(Math.PI / 2)
    expect(mesh.rotation.z).toBeCloseTo(Math.PI)
    anim.revert()
  })
})
