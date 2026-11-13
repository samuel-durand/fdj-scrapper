import { lazy, Suspense, useEffect, useState } from 'react'
import './Background.css'

// three.js n'est téléchargé que si la 3D est réellement utilisée.
const SceneCanvas = lazy(() => import('./SceneCanvas'))

/** La 3D est-elle souhaitable sur cet appareil ? Sinon : dégradé statique. */
function canUse3D() {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
    if (navigator.connection?.saveData) return false
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!gl) return false
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

/** Profondeur de défilement (0 en haut de page, 1 après ~600 px) exposée en CSS : --scroll. */
function useScrollDepth() {
  useEffect(() => {
    const root = document.documentElement
    let frame = 0
    const update = () => {
      frame = 0
      root.style.setProperty('--scroll', Math.min(1, window.scrollY / 600).toFixed(3))
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])
}

/**
 * Fond de l'application : dégradé aux couleurs du jeu, scène 3D par-dessus,
 * puis un voile qui s'épaissit quand on descend vers les données.
 */
export default function Background({ game, theme }) {
  const [enabled, setEnabled] = useState(false)
  useScrollDepth()

  useEffect(() => {
    if (!canUse3D()) return undefined
    // On attend que la page soit affichée : la 3D ne doit jamais retarder les résultats.
    const start = () => setEnabled(true)
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(start, { timeout: 1500 })
      return () => window.cancelIdleCallback(id)
    }
    const id = setTimeout(start, 400)
    return () => clearTimeout(id)
  }, [])

  return (
    <div className="backdrop" aria-hidden="true">
      {enabled && (
        <Suspense fallback={null}>
          <SceneCanvas game={game} theme={theme} />
        </Suspense>
      )}
      <div className="backdrop__veil" />
    </div>
  )
}
