/**
 * Scène 3D de fond : un « boulier » propre à chaque jeu.
 *
 *  - EuroMillions : ciel étoilé, boules bleues et 12 étoiles dorées
 *  - Loto         : boules bleues qui rebondissent, numéros chance rouges, bokeh lumineux
 *  - EuroDreams   : boules en verre irisé dans une brume violette
 *  - Keno         : 56 boules vertes et bokeh mentholé
 *  - Crescendo    : boules orange, lettres violettes, ciel étoilé chaud
 *  - Amigo        : boules bleues et jaunes, bokeh doré
 *
 * Deux canvas :
 *  - `bg` (derrière l'interface) : l'ambiance ;
 *  - `fx` (au-dessus de l'interface, sans clic) : uniquement pendant l'animation du tirage,
 *    quand les boules quittent le fond pour se poser sur les numéros de la carte résultat.
 *
 * API : createLotteryScene(host, { game, theme }) -> { setGame, setTheme, playDraw, dispose } | null
 */
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

const GAMES = {
  euromillions: {
    main: { count: 50, color: '#2e40b8', ink: '#1f2b8f' },
    comp: { count: 12, kind: 'star', color: '#ffc800' },
    ambience: 'stars',
    glow: { light: '#6f80ff', dark: '#4f62e6' },
  },
  loto: {
    main: { count: 49, color: '#0a72d6', ink: '#0067c8' },
    comp: { count: 10, kind: 'chance', color: '#e4002b', ink: '#c20025' },
    ambience: 'bokeh',
    glow: { light: '#7cc4ff', dark: '#1c8bf0' },
  },
  eurodreams: {
    main: { count: 40, color: '#7a36b3', ink: '#5a2d91' },
    comp: { count: 5, kind: 'dream', color: '#e6007e', ink: '#b30062' },
    ambience: 'mist',
    glow: { light: '#ff7ac8', dark: '#b45ae6' },
    glass: true,
  },
  keno: {
    main: { count: 56, color: '#0c8f68', ink: '#08795a' },
    comp: { count: 0, kind: 'none' },
    ambience: 'bokeh',
    particles: '#9ff5d2',
    glow: { light: '#6fe3b8', dark: '#14a87c' },
  },
  crescendo: {
    main: { count: 25, color: '#e0600f', ink: '#c94a06' },
    comp: { values: ['A', 'D', 'E', 'I', 'M', 'S'], kind: 'letter', color: '#6d28c9', ink: '#5a1fab' },
    ambience: 'stars',
    particles: '#ffd2a8',
    glow: { light: '#ffb36b', dark: '#f07a2c' },
  },
  amigo: {
    main: { count: 28, color: '#0b78b5', ink: '#075e91' },
    comp: { count: 28, kind: 'yellow', color: '#ffc800', ink: '#7a5a00' },
    ambience: 'bokeh',
    particles: '#ffe58a',
    glow: { light: '#ffd84d', dark: '#1d93cf' },
  },
}

const THEMES = {
  light: { hemi: 1.1, key: 2.2, env: 1.0, emissive: 0.0, particles: 0.75 },
  dark: { hemi: 0.55, key: 1.6, env: 0.7, emissive: 0.18, particles: 1.0 },
}

const CAM_Z = 14
const FOV = 45
const BALL_R = 0.5
const STAR_R = 0.62 // rayon extérieur de l'étoile (avec biseau)
const FLIGHT = 0.9 // durée du vol vers la carte (s) — synchronisée avec Results.css
const STAGGER = 0.12 // décalage entre deux boules (s) — idem

const rand = (a, b) => a + Math.random() * (b - a)
const clamp01 = (x) => Math.min(1, Math.max(0, x))
const easeOut = (t) => 1 - Math.pow(1 - t, 3)
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const damp = (current, target, lambda, dt) => current + (target - current) * (1 - Math.exp(-lambda * dt))

function makeRenderer(canvas, mobile) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !mobile, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.75))
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  return renderer
}

function makeEnvironment(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer)
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  pmrem.dispose()
  return env
}

/** Texture d'une boule : couleur du jeu + pastille blanche avec le numéro, des deux côtés. */
function ballTexture(n, color, ink, size) {
  const c = document.createElement('canvas')
  c.width = size * 2
  c.height = size
  const g = c.getContext('2d')
  g.fillStyle = color
  g.fillRect(0, 0, c.width, c.height)
  for (const u of [0.25, 0.75]) {
    const cx = u * c.width
    const cy = size / 2
    g.fillStyle = '#ffffff'
    g.beginPath()
    g.arc(cx, cy, size * 0.2, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = ink
    g.font = `900 ${Math.round(size * 0.21)}px "Nunito Sans", system-ui, sans-serif`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(String(n), cx, cy + size * 0.012)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

function softDotTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, inner)
  grad.addColorStop(1, outer)
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function starGeometry() {
  const shape = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.23 : 0.54
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.16, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.06, bevelSegments: 2,
  })
  geo.center()
  return geo
}

/** Position « idéale » d'une boule, en coordonnées normalisées (élargie selon l'écran). */
function randomHome() {
  // On dégage le centre (cartes) : la plupart des boules vont sur les côtés…
  for (;;) {
    const side = Math.random() < 0.75
    const nx = side ? (Math.random() < 0.5 ? -1 : 1) * rand(0.5, 1.05) : rand(-1, 1)
    const ny = rand(-1.05, 1.05)
    const z = side ? rand(-12, 1.5) : rand(-20, -11)
    // …et on évite le titre du bandeau (en haut à gauche) pour garder le texte lisible.
    const overTitle = nx > -0.85 && nx < 0.1 && ny > 0.25 && z > -14
    if (!overTitle) return { nx, ny, z }
  }
}

export function createLotteryScene(host, { game = 'euromillions', theme = 'light' } = {}) {
  const mobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 720
  const bgCanvas = document.createElement('canvas')
  bgCanvas.className = 'scene-canvas'
  let renderer
  try {
    renderer = makeRenderer(bgCanvas, mobile)
  } catch {
    return null
  }
  host.appendChild(bgCanvas)

  const scene = new THREE.Scene()
  scene.environment = makeEnvironment(renderer)
  const camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 0.1, 80)
  camera.position.set(0, 0, CAM_Z)

  const hemi = new THREE.HemisphereLight(0xffffff, 0x2a2f6b, 1)
  const key = new THREE.DirectionalLight(0xffffff, 2)
  key.position.set(6, 9, 10)
  const rim = new THREE.PointLight(0xffffff, 40, 40, 1.6)
  rim.position.set(-8, -4, 4)
  scene.add(hemi, key, rim)

  const sphereGeo = new THREE.SphereGeometry(BALL_R, mobile ? 22 : 32, mobile ? 16 : 24)
  const starGeo = starGeometry()
  const dotTex = softDotTexture()
  const texSize = mobile ? 96 : 128
  const disposables = [sphereGeo, starGeo, dotTex]

  // ------------------------------------------------------------ Groupes par jeu
  const groups = {}

  function buildBall(def, n, kind, glass) {
    let mesh
    if (kind === 'star') {
      const mat = new THREE.MeshStandardMaterial({
        color: def.color, metalness: 0.85, roughness: 0.22, emissive: '#ffb300', emissiveIntensity: 0.15, transparent: true,
      })
      mesh = new THREE.Mesh(starGeo, mat)
      disposables.push(mat)
    } else {
      const map = ballTexture(n, def.color, def.ink || def.color, texSize)
      const mat = glass
        ? new THREE.MeshPhysicalMaterial({
            map, roughness: 0.08, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05,
            iridescence: 0.9, iridescenceIOR: 1.4, transparent: true, emissive: def.color, emissiveIntensity: 0,
          })
        : new THREE.MeshStandardMaterial({
            map, roughness: 0.18, metalness: 0.05, transparent: true, emissive: def.color, emissiveIntensity: 0,
          })
      mesh = new THREE.Mesh(sphereGeo, mat)
      disposables.push(mat, map)
    }
    const home = randomHome()
    const s = rand(0.75, 1.25) * (kind === 'star' ? 1.1 : 1)
    mesh.scale.setScalar(s)
    mesh.rotation.set(rand(0, Math.PI * 2), rand(0, Math.PI * 2), 0)
    const dir = new THREE.Vector3(home.nx || 0.01, rand(-1, 1), 0).normalize()
    return {
      mesh, n, kind, home, baseScale: s, dir,
      phase: rand(0, Math.PI * 2), speed: rand(0.6, 1.3), spin: new THREE.Vector3(rand(-0.3, 0.3), rand(-0.4, 0.4), 0),
      delay: rand(0, 0.5), appear: 1, flying: false,
    }
  }

  function buildAmbience(type, tint) {
    const group = new THREE.Group()
    const items = []
    if (type === 'stars') {
      for (const layer of [0, 1]) {
        const count = mobile ? 160 : 380
        const pos = new Float32Array(count * 3)
        for (let i = 0; i < count; i++) {
          pos[i * 3] = rand(-30, 30)
          pos[i * 3 + 1] = rand(-18, 18)
          pos[i * 3 + 2] = rand(-30, -4)
        }
        const geo = new THREE.BufferGeometry()
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
        const mat = new THREE.PointsMaterial({
          size: layer ? 0.16 : 0.1, map: dotTex, color: layer ? (tint || '#fff4c2') : '#ffffff', transparent: true,
          depthWrite: false, blending: THREE.AdditiveBlending,
        })
        const pts = new THREE.Points(geo, mat)
        group.add(pts)
        disposables.push(geo, mat)
        items.push({ mat, twinkle: layer ? 1.7 : 1.1, phase: layer * 2, base: 0.85 })
      }
    } else if (type === 'bokeh') {
      const count = mobile ? 40 : 80
      const pos = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        pos[i * 3] = rand(-22, 22)
        pos[i * 3 + 1] = rand(-14, 14)
        pos[i * 3 + 2] = rand(-20, -2)
      }
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      const mat = new THREE.PointsMaterial({
        size: 1.1, map: dotTex, color: tint || '#9fd3ff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      })
      const pts = new THREE.Points(geo, mat)
      group.add(pts)
      disposables.push(geo, mat)
      items.push({ mat, base: 0.4, rise: { geo, count, speed: 0.35 } })
    } else if (type === 'mist') {
      const mistTex = softDotTexture('rgba(255,255,255,0.9)', 'rgba(255,255,255,0)')
      disposables.push(mistTex)
      const colors = ['#c48bff', '#ff7ac8', '#8a5cff', '#ffa6dc']
      for (let i = 0; i < (mobile ? 5 : 8); i++) {
        const mat = new THREE.SpriteMaterial({
          map: mistTex, color: colors[i % colors.length], transparent: true, depthWrite: false,
          blending: THREE.AdditiveBlending, opacity: 0.16,
        })
        const sprite = new THREE.Sprite(mat)
        sprite.position.set(rand(-14, 14), rand(-8, 8), rand(-18, -6))
        sprite.scale.setScalar(rand(12, 20))
        group.add(sprite)
        disposables.push(mat)
        items.push({ mat, base: 0.16, drift: { sprite, ox: sprite.position.x, oy: sprite.position.y, ph: rand(0, 6) } })
      }
      const count = mobile ? 70 : 150
      const pos = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        pos[i * 3] = rand(-24, 24)
        pos[i * 3 + 1] = rand(-15, 15)
        pos[i * 3 + 2] = rand(-22, 0)
      }
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      const mat = new THREE.PointsMaterial({
        size: 0.14, map: dotTex, color: '#ffd1f0', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      })
      group.add(new THREE.Points(geo, mat))
      disposables.push(geo, mat)
      items.push({ mat, base: 0.9, twinkle: 0.8, phase: 1, rise: { geo, count, speed: 0.12 } })
    }
    return { group, items }
  }

  function ensureGroup(key) {
    if (groups[key]) return groups[key]
    const def = GAMES[key]
    const root = new THREE.Group()
    const balls = []
    for (let n = 1; n <= def.main.count; n++) balls.push(buildBall(def.main, n, 'main', def.glass))
    const compValues = def.comp.values || Array.from({ length: def.comp.count || 0 }, (_, i) => i + 1)
    for (const v of compValues) balls.push(buildBall(def.comp, v, def.comp.kind, false))
    balls.forEach((b) => root.add(b.mesh))
    const ambience = buildAmbience(def.ambience, def.particles)
    root.add(ambience.group)
    root.visible = false
    scene.add(root)
    groups[key] = { key, def, root, balls, ambience, state: 'idle', t0: 0, fade: 0 }
    return groups[key]
  }

  // ------------------------------------------------------------ État
  let current = null
  let leaving = null
  let themeName = theme in THEMES ? theme : 'light'
  let clock = 0
  // Horloge réelle pour le vol des boules : reste synchrone avec l'animation CSS même si la 3D rame
  const wall = () => performance.now() / 1000
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 }
  let scrollDepth = 0

  function setGame(key) {
    if (!GAMES[key] || current?.key === key) return
    if (current) {
      leaving = current
      leaving.state = 'out'
      leaving.t0 = clock
    }
    current = ensureGroup(key)
    current.root.visible = true
    current.state = 'in'
    current.t0 = clock
    current.balls.forEach((b) => { b.delay = rand(0, 0.45) })
    applyTheme()
  }

  function applyTheme() {
    const t = THEMES[themeName]
    hemi.intensity = t.hemi
    key.intensity = t.key
    scene.environmentIntensity = t.env
    const glow = current ? current.def.glow[themeName] : '#ffffff'
    rim.color.set(glow)
    rim.intensity = themeName === 'dark' ? 70 : 30
    hemi.groundColor.set(themeName === 'dark' ? '#0d0f22' : '#c9cdf0')
    for (const g of Object.values(groups)) {
      for (const b of g.balls) {
        if (b.kind !== 'star') b.mesh.material.emissiveIntensity = t.emissive
      }
    }
  }

  function setTheme(name) {
    if (!(name in THEMES) || name === themeName) return
    themeName = name
    applyTheme()
    if (fx) fx.applyTheme()
  }

  // ------------------------------------------------------------ Canvas d'animation du tirage
  let fx = null
  function ensureFx() {
    if (fx) return fx
    const canvas = document.createElement('canvas')
    canvas.className = 'scene-fx'
    let r
    try {
      r = makeRenderer(canvas, mobile)
    } catch {
      return null
    }
    document.body.appendChild(canvas)
    const s = new THREE.Scene()
    s.environment = makeEnvironment(r)
    const h = new THREE.HemisphereLight(0xffffff, 0x2a2f6b, 1)
    const k = new THREE.DirectionalLight(0xffffff, 2)
    k.position.copy(key.position)
    s.add(h, k)
    fx = {
      canvas, renderer: r, scene: s, active: false,
      applyTheme() {
        const t = THEMES[themeName]
        h.intensity = t.hemi + 0.3
        k.intensity = t.key
        s.environmentIntensity = t.env
      },
    }
    fx.applyTheme()
    applySize()
    return fx
  }

  const flights = []
  const tmpV = new THREE.Vector3()
  const identity = new THREE.Quaternion()

  function returnHome(f) {
    const b = f.ball
    b.flying = false
    b.appear = 0 // réapparaît en douceur dans le boulier
    b.mesh.quaternion.copy(f.fromQuat)
    b.mesh.material.opacity = 0
    f.group.root.add(b.mesh)
  }

  /** Lance l'animation : chaque boule du tirage quitte le fond et vient se poser sur la carte. */
  function playDraw({ game: key, container } = {}) {
    if (!container || !GAMES[key]) return
    setGame(key)
    const rect = container.getBoundingClientRect()
    if (rect.bottom < 0 || rect.top > window.innerHeight) return
    if (!ensureFx()) return

    // Un nouveau tirage annule les vols en cours.
    while (flights.length) returnHome(flights.pop())

    const group = groups[key]
    container.querySelectorAll('.ball').forEach((el, idx) => {
      const n = el.textContent.trim()
      const kind = el.classList.contains('ball--star') ? 'star'
        : el.classList.contains('ball--chance') ? 'chance'
          : el.classList.contains('ball--dream') ? 'dream'
            : el.classList.contains('ball--letter') ? 'letter'
              : el.classList.contains('ball--yellow') ? 'yellow' : 'main'
      let ball = group.balls.find((b) => String(b.n) === n && b.kind === kind && !b.flying)
      if (!ball && kind !== 'main' && n && !group.balls.some((b) => String(b.n) === n && b.kind === kind)) {
        // Valeur jamais vue (nouvelle lettre Crescendo…) : la boule est créée à la volée, au fond.
        const def = group.def.comp
        ball = buildBall(def, n, kind, false)
        ball.mesh.position.set(ball.home.nx * 8, ball.home.ny * 5, -18)
        group.balls.push(ball)
        group.root.add(ball.mesh)
        applyTheme()
      }
      if (!ball) return
      const i = parseFloat(el.style.getPropertyValue('--i'))
      ball.flying = true
      flights.push({
        ball, el, group, start: wall() + (Number.isFinite(i) ? i : idx) * STAGGER, started: false,
        from: new THREE.Vector3(), ctrl: new THREE.Vector3(), fromScale: 1, fromQuat: new THREE.Quaternion(), spinAxis: Math.random() < 0.5 ? 1 : -1,
      })
    })
  }

  /** Point 3D (et échelle) correspondant au centre d'un élément du DOM, à 6 unités devant la caméra. */
  function domTarget(el, radius, out) {
    const r = el.getBoundingClientRect()
    const ndcX = ((r.left + r.width / 2) / window.innerWidth) * 2 - 1
    const ndcY = -((r.top + r.height / 2) / window.innerHeight) * 2 + 1
    tmpV.set(ndcX, ndcY, 0.5).unproject(camera).sub(camera.position).normalize()
    const depth = 6
    const s = -depth / tmpV.z
    out.copy(camera.position).addScaledVector(tmpV, s)
    const worldPerPx = (2 * depth * Math.tan(THREE.MathUtils.degToRad(FOV / 2))) / window.innerHeight
    return ((el.offsetWidth || r.width) / 2) * worldPerPx / radius
  }

  const target = new THREE.Vector3()
  function updateFlights() {
    if (!fx) return
    for (let i = flights.length - 1; i >= 0; i--) {
      const f = flights[i]
      const b = f.ball
      const now = wall()
      if (now < f.start) continue
      if (!f.el.isConnected) {
        if (f.started) fx.scene.remove(b.mesh)
        returnHome(f)
        flights.splice(i, 1)
        continue
      }
      if (!f.started) {
        f.started = true
        f.from.copy(b.mesh.position)
        f.fromScale = b.mesh.scale.x
        f.fromQuat.copy(b.mesh.quaternion)
        f.group.root.remove(b.mesh)
        fx.scene.add(b.mesh)
      }
      const radius = b.kind === 'star' ? STAR_R : BALL_R
      const targetScale = domTarget(f.el, radius, target)
      const p = clamp01((now - f.start) / FLIGHT)
      const e = easeInOut(p)
      // Courbe de Bézier : la boule monte un peu avant de redescendre sur la carte
      f.ctrl.copy(f.from).lerp(target, 0.5)
      f.ctrl.y += 2.4
      f.ctrl.z += 2
      const u = 1 - e
      b.mesh.position.set(
        u * u * f.from.x + 2 * u * e * f.ctrl.x + e * e * target.x,
        u * u * f.from.y + 2 * u * e * f.ctrl.y + e * e * target.y,
        u * u * f.from.z + 2 * u * e * f.ctrl.z + e * e * target.z,
      )
      b.mesh.scale.setScalar(THREE.MathUtils.lerp(f.fromScale, targetScale, e))
      b.mesh.quaternion.slerpQuaternions(f.fromQuat, identity, e)
      b.mesh.rotateY((1 - e) * Math.PI * 2 * f.spinAxis)
      // Arrivée : la boule 3D s'efface pendant que la boule de la carte apparaît.
      const landed = now - f.start - FLIGHT
      b.mesh.material.opacity = landed > 0 ? clamp01(1 - landed / 0.22) : 1
      if (landed > 0.25) {
        fx.scene.remove(b.mesh)
        returnHome(f)
        flights.splice(i, 1)
      }
    }
  }

  // ------------------------------------------------------------ Animation
  function halfWidth(z) {
    return Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * (CAM_Z - z) * camera.aspect
  }
  function halfHeight(z) {
    return Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * (CAM_Z - z)
  }

  function updateGroup(g, dt) {
    const age = clock - g.t0
    const ambience = g.def.ambience
    let groupFade = 1
    if (g.state === 'out') {
      groupFade = 1 - clamp01(age / 0.9)
      if (age > 0.9) {
        g.state = 'idle'
        g.root.visible = false
        return
      }
    }

    for (const b of g.balls) {
      if (b.flying) continue
      const h = b.home
      const t = clock * b.speed + b.phase
      let x = h.nx * halfWidth(h.z) * 1.05
      let y = h.ny * halfHeight(h.z) * 1.05
      let z = h.z
      if (ambience === 'stars') {
        x += Math.sin(t * 0.35) * 0.5
        y += Math.sin(t * 0.45 + 1) * 0.6
      } else if (ambience === 'bokeh') {
        y += Math.abs(Math.sin(t * 0.9)) * 0.9 - 0.45 // petits rebonds
        x += Math.sin(t * 0.25) * 0.4
      } else {
        y += Math.sin(t * 0.22) * 1.1 // flottement lent, comme dans un rêve
        x += Math.sin(t * 0.17 + 2) * 0.7
        z += Math.sin(t * 0.13) * 0.8
      }

      let opacity = 0.35 + 0.65 * clamp01((z + 16) / 14) // les boules lointaines s'estompent
      if (g.state === 'in') {
        const p = easeOut(clamp01((age - b.delay) / 1.1))
        x += b.dir.x * (1 - p) * 14
        y += b.dir.y * (1 - p) * 8
        z -= (1 - p) * 14
        opacity *= p
      } else if (g.state === 'out') {
        const p = clamp01(age / 0.9)
        const e = p * p
        x += b.dir.x * e * 16
        y += b.dir.y * e * 9
        z += e * 8
      }
      if (b.appear < 1) {
        b.appear = Math.min(1, b.appear + dt / 1.4)
        opacity *= b.appear
      }
      b.mesh.position.set(x, y, z)
      b.mesh.rotation.x += b.spin.x * dt
      b.mesh.rotation.y += b.spin.y * dt
      if (b.kind === 'star') b.mesh.rotation.z += dt * 0.3
      b.mesh.scale.setScalar(b.baseScale * (b.appear < 1 ? 0.6 + 0.4 * easeOut(b.appear) : 1))
      b.mesh.material.opacity = opacity * groupFade * (g.def.glass && b.kind === 'main' ? 0.82 : 1)
    }

    if (g.state === 'in' && age > 1.7) g.state = 'idle'
    const inFade = g.state === 'in' ? clamp01(age / 1.2) : 1
    const pFactor = THEMES[themeName].particles * groupFade * inFade
    for (const it of g.ambience.items) {
      let o = it.base
      if (it.twinkle) o *= 0.65 + 0.35 * Math.sin(clock * it.twinkle + it.phase)
      it.mat.opacity = o * pFactor
      if (it.rise) {
        const arr = it.rise.geo.attributes.position.array
        for (let i = 0; i < it.rise.count; i++) {
          arr[i * 3 + 1] += dt * it.rise.speed * (0.5 + (i % 5) * 0.2)
          if (arr[i * 3 + 1] > 15) arr[i * 3 + 1] = -15
        }
        it.rise.geo.attributes.position.needsUpdate = true
      }
      if (it.drift) {
        const d = it.drift
        d.sprite.position.x = d.ox + Math.sin(clock * 0.07 + d.ph) * 3
        d.sprite.position.y = d.oy + Math.cos(clock * 0.05 + d.ph) * 2
      }
    }
    if (ambience === 'stars') g.ambience.group.rotation.z += dt * 0.004
  }

  function applySize() {
    const w = window.innerWidth
    const h = window.innerHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(pixelRatio)
    renderer.setSize(w, h, false)
    if (fx) {
      fx.renderer.setPixelRatio(pixelRatio)
      fx.renderer.setSize(w, h, false)
    }
  }
  // Sur mobile, la barre d'adresse qui apparaît/disparaît déclenche des « resize » en rafale :
  // on regroupe pour ne pas réallouer le canvas en plein défilement.
  let resizeTimer = 0
  function resize() {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(applySize, 120)
  }

  // ------------------------------------------------------------ Qualité adaptative
  // Si la machine peine (images > 22 ms en moyenne), on baisse la résolution du rendu ;
  // si elle est à l'aise, on la remonte. Le texte et l'interface ne sont pas concernés.
  const maxRatio = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.75)
  let pixelRatio = maxRatio
  let frameAvg = 1 / 60
  let qualityTimer = 0
  function adaptQuality(rawDt) {
    frameAvg += (rawDt - frameAvg) * 0.05
    qualityTimer += rawDt
    if (qualityTimer < 1.5) return
    if (frameAvg > 0.022 && pixelRatio > 0.75) {
      pixelRatio = Math.max(0.75, pixelRatio - 0.25)
      applySize()
      qualityTimer = 0
    } else if (frameAvg < 0.0175 && pixelRatio < maxRatio && qualityTimer > 6) {
      pixelRatio = Math.min(maxRatio, pixelRatio + 0.25)
      applySize()
      qualityTimer = 0
    } else if (qualityTimer > 6) {
      qualityTimer = 1.5
    }
  }

  // ------------------------------------------------------------ Boucle
  let raf = 0
  let last = performance.now()
  let lastRender = last
  let running = true
  let scrollTarget = 0
  // Mobile : 30 i/s. Ordinateur : chaque image fournie par l'écran (60, 120, 144 Hz…).
  const minInterval = mobile ? 1000 / 30 : 0

  function frame(now) {
    raf = requestAnimationFrame(frame)
    if (minInterval) {
      // Tolérance de 25 % : un rAF arrivé un peu en avance ne fait plus sauter d'image.
      if (now - lastRender < minInterval * 0.75) return
      lastRender = now
    }
    const rawDt = Math.min(0.05, (now - last) / 1000)
    last = now
    const dt = rawDt
    clock += dt
    if (!minInterval) adaptQuality(rawDt)

    // Défilement et souris lissés : la caméra glisse au lieu de suivre chaque cran de molette.
    scrollTarget = clamp01(window.scrollY / 600)
    scrollDepth = damp(scrollDepth, scrollTarget, 7, dt)
    mouse.x = damp(mouse.x, mouse.tx, 3, dt)
    mouse.y = damp(mouse.y, mouse.ty, 3, dt)
    camera.position.set(mouse.x * 1.1, -mouse.y * 0.7 - scrollDepth * 1.5, CAM_Z + scrollDepth * 5)
    camera.lookAt(mouse.x * 0.25, -scrollDepth * 0.8 - mouse.y * 0.15, 0)
    camera.updateMatrixWorld()

    if (leaving) {
      updateGroup(leaving, dt)
      if (leaving.state === 'idle') leaving = null
    }
    if (current) updateGroup(current, dt)
    updateFlights()

    renderer.render(scene, camera)
    if (fx) {
      if (flights.length) {
        fx.renderer.render(fx.scene, camera)
        fx.active = true
      } else if (fx.active) {
        fx.renderer.clear()
        fx.active = false
      }
    }
  }

  const onPointer = (e) => {
    if (e.pointerType === 'touch') return
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1
  }
  const onVisibility = () => {
    if (document.hidden && running) {
      running = false
      cancelAnimationFrame(raf)
    } else if (!document.hidden && !running) {
      running = true
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
  }

  window.addEventListener('resize', resize)
  window.addEventListener('pointermove', onPointer, { passive: true })
  document.addEventListener('visibilitychange', onVisibility)

  // ------------------------------------------------------------ Préchauffage
  // Construire un jeu (≈60 textures + shaders) ou le canvas des boules en vol prend quelques
  // dizaines de ms : fait au premier changement d'onglet ou au premier tirage, ça provoque un
  // à-coup. On le fait donc à l'avance, une étape à la fois, quand le navigateur est inactif.
  let disposed = false
  let idleId = 0
  const idle = (fn) => {
    idleId = 'requestIdleCallback' in window
      ? window.requestIdleCallback(fn, { timeout: 3000 })
      : setTimeout(fn, 250)
  }
  const cancelIdle = () => {
    if ('cancelIdleCallback' in window) window.cancelIdleCallback(idleId)
    else clearTimeout(idleId)
  }

  function warmGroup(g) {
    const wasVisible = g.root.visible
    g.root.visible = true
    for (const b of g.balls) if (b.mesh.material.map) renderer.initTexture(b.mesh.material.map)
    renderer.compile(scene, camera)
    g.root.visible = wasVisible
  }

  function warmFx(g) {
    // Compile les shaders du canvas « vol » avec une boule de chaque sorte.
    const samples = [g.balls.find((b) => b.kind === 'main'), g.balls.find((b) => b.kind !== 'main')]
    for (const b of samples) {
      if (!b || b.flying) continue
      const parent = b.mesh.parent
      fx.scene.add(b.mesh)
      fx.renderer.compile(fx.scene, camera)
      parent.add(b.mesh)
    }
  }

  function warmup() {
    const steps = [
      ...Object.keys(GAMES).map((k) => () => {
        const fresh = !groups[k]
        const g = ensureGroup(k)
        if (fresh) applyTheme()
        warmGroup(g)
      }),
      () => ensureFx(),
      ...Object.keys(GAMES).map((k) => () => fx && warmFx(groups[k])),
    ]
    const next = () => {
      if (disposed) return
      const step = steps.shift()
      if (!step) return
      try { step() } catch { /* le préchauffage est facultatif */ }
      idle(next)
    }
    idle(next)
  }

  applySize()
  setGame(game)
  applyTheme()
  raf = requestAnimationFrame(frame)
  requestAnimationFrame(() => bgCanvas.classList.add('is-ready'))
  warmup()

  return {
    setGame,
    setTheme,
    playDraw,
    dispose() {
      disposed = true
      cancelIdle()
      cancelAnimationFrame(raf)
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
      document.removeEventListener('visibilitychange', onVisibility)
      disposables.forEach((d) => d.dispose())
      scene.environment?.dispose()
      renderer.dispose()
      bgCanvas.remove()
      if (fx) {
        fx.scene.environment?.dispose()
        fx.renderer.dispose()
        fx.canvas.remove()
      }
    },
  }
}
