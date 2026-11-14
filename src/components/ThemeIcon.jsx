/**
 * Icône du thème : soleil jaune (clair) qui se transforme en croissant de lune jaune (sombre).
 * Les rayons tournent et se rétractent, le disque grossit et une « ombre » vient le grignoter
 * pour former le croissant (et l'inverse au retour). Styles : .theme-icon dans App.css.
 */
export default function ThemeIcon({ dark }) {
  return (
    <svg className={`theme-icon ${dark ? 'is-dark' : ''}`} width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <mask id="theme-icon-mask">
          <rect x="0" y="0" width="24" height="24" fill="#fff" />
          {/* l'ombre qui découpe le croissant : hors du disque en mode clair */}
          <circle className="theme-icon__shadow" cx="17.5" cy="7.5" r="6.5" fill="#000" />
        </mask>
      </defs>
      <circle className="theme-icon__disc" cx="12" cy="12" r="5" fill="currentColor" mask="url(#theme-icon-mask)" />
      <g className="theme-icon__rays" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 1.5v2.5M12 20v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M1.5 12h2.5M20 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" />
      </g>
    </svg>
  )
}
