import { useEffect, useRef } from 'react'
import { createLotteryScene } from '../../three/lotteryScene'

/** Monte la scène three.js (chargée à la demande) et la synchronise avec le jeu et le thème. */
export default function SceneCanvas({ game, theme }) {
  const hostRef = useRef(null)
  const sceneRef = useRef(null)

  useEffect(() => {
    const scene = createLotteryScene(hostRef.current, { game, theme })
    if (!scene) return undefined
    sceneRef.current = scene
    const root = document.documentElement
    root.classList.add('has-3d')

    // Animation du tirage : envoyée par la carte résultat (GameResults > DrawCard)
    const onDraw = (e) => scene.playDraw(e.detail)
    window.addEventListener('lottery:draw', onDraw)

    return () => {
      window.removeEventListener('lottery:draw', onDraw)
      root.classList.remove('has-3d')
      scene.dispose()
      sceneRef.current = null
    }
    // La scène est créée une seule fois ; jeu et thème sont transmis par les effets ci-dessous.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { sceneRef.current?.setGame(game) }, [game])
  useEffect(() => { sceneRef.current?.setTheme(theme) }, [theme])

  return <div className="backdrop__scene" ref={hostRef} />
}
