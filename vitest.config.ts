import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Force a single copy of three across the dep graph. anime.js's three adapter
  // detects targets with `instanceof Object3D`; without this, vitest loads the
  // CJS build of @react-three/fiber (which pulls its own three) while the adapter
  // uses ESM three, the instanceof fails, and rotateX/Y/Z fall through to native
  // Object3D methods -> `str.includes` crash. Inlining the three-related packages
  // routes them all through Vite's ESM pipeline with the deduped three.
  resolve: {
    dedupe: ['three', 'three-bvh-csg', 'three-mesh-bvh'],
    // Prefer each package's ESM `module` entry over its CJS `main`. @react-three/*
    // ship both; vitest defaults to `main` (CJS), which loads a second three and
    // breaks the adapter's instanceof check. Forcing ESM keeps a single three.
    mainFields: ['module', 'browser', 'main'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    server: {
      deps: {
        inline: ['animejs', '@react-three/fiber', '@react-three/test-renderer', 'three', 'three-bvh-csg', 'three-mesh-bvh'],
      },
    },
  },
})
