import { useRef, useState } from 'react'
import type { Mesh } from 'three'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Leva } from 'leva'
import { Scene } from './scene/Scene'
import { FixarScene } from './scene/FixarScene'
import { SquashControls } from './scene/SquashControls'
import { LuxoPlayground } from './luxo/LuxoPlayground'
import { LuxoRealPlayground } from './luxoReal/LuxoRealPlayground'
import { LuxoArmadaPlayground } from './luxoArmada/LuxoArmadaPlayground'
import { PowerPolePlayground } from './powerPole/PowerPolePlayground'

function PixarRoute() {
  const iRef = useRef<Mesh>(null)
  // Colapso controlado del panel: al darle ▶ repetir se cierra para ver la
  // animación limpia (se puede reabrir manualmente desde la flechita).
  const [collapsed, setCollapsed] = useState(false)
  return (
    <>
      <Leva collapsed={{ collapsed, onChange: setCollapsed }} />
      <SquashControls target={iRef} />
      <Scene iRef={iRef} onReplay={() => setCollapsed(true)} />
    </>
  )
}

// Sandbox aislado para probar el FIX del bop (usa jumpAnimationFixed).
function FixarRoute() {
  const iRef = useRef<Mesh>(null)
  const [collapsed, setCollapsed] = useState(false)
  return (
    <>
      <Leva collapsed={{ collapsed, onChange: setCollapsed }} />
      <FixarScene iRef={iRef} onReplay={() => setCollapsed(true)} />
    </>
  )
}

const navStyle: React.CSSProperties = {
  position: 'fixed', top: 8, left: 8, zIndex: 10, display: 'flex', gap: 8,
  font: '14px system-ui', background: 'rgba(0,0,0,.4)', padding: '6px 10px', borderRadius: 6,
}

export default function App() {
  return (
    <BrowserRouter>
      <nav style={navStyle}>
        <Link to="/" style={{ color: '#fff' }}>PIXAR</Link>
        <Link to="/luxo" style={{ color: '#fff' }}>Luxo</Link>
        <Link to="/luxo-real" style={{ color: '#fff' }}>Luxo real</Link>
        <Link to="/luxo-armada" style={{ color: '#fff' }}>Luxo armada</Link>
        <Link to="/power-pole" style={{ color: '#fff' }}>Poste</Link>
        <Link to="/fixar" style={{ color: '#fff' }}>Fixar</Link>
      </nav>
      <Routes>
        <Route path="/" element={<PixarRoute />} />
        <Route path="/luxo" element={<LuxoPlayground />} />
        <Route path="/luxo-real" element={<LuxoRealPlayground />} />
        <Route path="/luxo-armada" element={<LuxoArmadaPlayground />} />
        <Route path="/power-pole" element={<PowerPolePlayground />} />
        <Route path="/fixar" element={<FixarRoute />} />
      </Routes>
    </BrowserRouter>
  )
}
