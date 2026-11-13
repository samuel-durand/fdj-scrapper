import { useEffect, useState } from 'react'

const read = () => document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'

/** Thème courant ('light' | 'dark'), mis à jour en direct quand l'utilisateur bascule. */
export default function useTheme() {
  const [theme, setTheme] = useState(read)
  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(read()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])
  return theme
}
