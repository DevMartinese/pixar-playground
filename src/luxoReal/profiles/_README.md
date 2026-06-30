# Perfiles fieles a STL

Estos datos se EXTRAJERON una sola vez (offline) de los STL del modelo imprimible
con `stl_extract.py` (en el scratchpad de la sesión), sliceando cada malla.
Están en UNIDADES RELATIVAS (÷199.98 mm = ancho del foot = 1.0).
NO son la malla STL: son el perfil/contorno reproducido procedural.
Cada archivo `*Profile.ts` / `*Contour.ts` documenta su STL de origen y bbox real.

## Notas de reconstrucción
- **link / section / hinges**: el slicer de contornos planos era poco confiable
  (fragmentaba el borde), así que se reconstruyeron del **bbox real** (stadium con
  agujeros) o por **convex-hull** de los vértices (hinges). Ver comentarios en cada
  archivo.
- **reflector / head-neck**: no tienen `*Profile.ts` propio — usan dimensiones
  inline en `parts/Reflector.tsx` y `parts/HeadNeck.tsx` (reflector ≈ proporcional
  a la cabeza; neck = cilindro recto, el STL lo tiene inclinado ~50°). Ver ahí.
- **links_v1 / box_sections**: placas modeladas por **silueta convex-hull**
  (best-effort, como los hinges; agujeros internos simplificados), porque el
  slicer de contornos planos no era confiable en esas formas.
