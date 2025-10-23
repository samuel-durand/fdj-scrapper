# 📁 Structure du Projet - Application Loterie FDJ

## 🎯 Vue d'Ensemble

Application web moderne pour consulter les résultats officiels de l'EuroMillions et du Loto, avec scraping en temps réel depuis le site FDJ.

---

## 📂 Arborescence des Fichiers

```
loterie/
│
├── 📄 Configuration
│   ├── index.html              # Page HTML principale
│   ├── package.json            # Dépendances Node.js
│   ├── package-lock.json       # Lock des dépendances
│   └── vite.config.js          # Configuration Vite
│
├── 🚀 Scripts de Démarrage
│   ├── start-all.bat           # Démarre tout (proxy + app)
│   ├── start-app.bat           # Démarre uniquement l'app React
│   ├── start-proxy.bat         # Démarre uniquement le serveur proxy
│   ├── start-complet.bat       # Démarrage complet
│   ├── start-scheduler.bat     # Script scheduler (si besoin)
│   └── restart-servers.bat     # Redémarre les serveurs
│
├── 🔧 Backend / Serveurs
│   ├── server-proxy-example.js # Serveur proxy API (port 3001)
│   └── scraper-fdj.js          # Scraper principal FDJ
│
├── 💾 Données
│   ├── resultats-cache.json    # Cache des résultats scrapés
│   └── year-data-2025.js       # Données de fallback 2025
│
├── 📖 Documentation
│   ├── README.md               # Guide principal du projet
│   ├── COMMENT_CA_MARCHE.md    # Explications techniques
│   ├── DEMARRAGE_RAPIDE.md     # Guide de démarrage rapide
│   └── GUIDE_FINAL.md          # Guide complet d'utilisation
│
└── 📱 Application React (src/)
    │
    ├── main.jsx                # Point d'entrée React
    ├── App.jsx                 # Composant principal
    ├── App.css                 # Styles de l'app
    ├── index.css               # Styles globaux
    │
    ├── components/             # Composants React
    │   ├── Euromillions.jsx    # Page EuroMillions
    │   ├── Loto.jsx            # Page Loto
    │   ├── Calendar.jsx        # Calendrier des tirages
    │   ├── Calendar.css        # Styles calendrier
    │   ├── Pagination.jsx      # Composant pagination
    │   ├── Pagination.css      # Styles pagination
    │   ├── DrawDetailsModal.jsx # Modal détails tirage
    │   ├── DrawDetailsModal.css # Styles modal
    │   └── Lottery.css         # Styles communs loterie
    │
    └── services/               # Services API
        └── lotteryService.js   # Service récupération données
```

---

## 🎯 Fichiers Essentiels

### 🔑 Configuration de Base
- **package.json** : Dépendances (React, Vite, node-fetch, cheerio)
- **vite.config.js** : Configuration du serveur de développement
- **index.html** : Point d'entrée HTML

### 🖥️ Scripts Serveurs
- **server-proxy-example.js** : API locale qui sert les données scrapées
- **scraper-fdj.js** : Scraper qui récupère les résultats depuis FDJ
- **year-data-2025.js** : Données de fallback pour 2025

### 📦 Données
- **resultats-cache.json** : Cache JSON des résultats scrapés
  - Mis à jour automatiquement lors du scraping
  - Format : `{ euromillions: [...], loto: [...] }`

### 🎨 Code Source React
- **App.jsx** : Navigation entre EuroMillions et Loto
- **Euromillions.jsx** : Affichage des résultats EuroMillions
- **Loto.jsx** : Affichage des résultats Loto
- **Calendar.jsx** : Calendrier interactif des tirages
- **Pagination.jsx** : Navigation entre les tirages
- **DrawDetailsModal.jsx** : Modal avec détails complets d'un tirage
- **lotteryService.js** : Service pour récupérer les données depuis l'API

### 📝 Documentation
- **README.md** : Guide principal
- **COMMENT_CA_MARCHE.md** : Explications techniques
- **DEMARRAGE_RAPIDE.md** : Démarrage rapide
- **GUIDE_FINAL.md** : Guide complet

---

## 🔄 Flux de Données

```
1. Scraper FDJ (scraper-fdj.js)
   ↓
2. Cache JSON (resultats-cache.json)
   ↓
3. Serveur Proxy (server-proxy-example.js:3001)
   ↓
4. Service API (lotteryService.js)
   ↓
5. Composants React (Euromillions.jsx, Loto.jsx)
   ↓
6. Interface Utilisateur (navigateur)
```

---

## 🚀 Démarrage

### Option 1 : Tout en Une
```bash
start-all.bat
```
Lance automatiquement :
- Serveur proxy (port 3001)
- Application React (port 5173)

### Option 2 : Manuel
```bash
# Terminal 1 - Serveur proxy
node server-proxy-example.js

# Terminal 2 - Application React
npm run dev
```

Puis ouvrir : http://localhost:5173

---

## 📊 Ports Utilisés

- **5173** : Application React (Vite)
- **3001** : Serveur proxy API

---

## 🎨 Technologies

### Frontend
- **React 18** : Framework UI
- **Vite** : Build tool et dev server
- **CSS moderne** : Animations, gradients, glass morphism

### Backend
- **Node.js** : Runtime JavaScript
- **Express** : Serveur API
- **node-fetch** : Requêtes HTTP
- **cheerio** : Parsing HTML
- **cors** : Gestion CORS

---

## 📝 Fichiers de Style

### Hiérarchie CSS
```
index.css (styles globaux)
  ├── Variables CSS FDJ
  ├── Fond animé
  └── Styles body

App.css (layout principal)
  ├── Header
  ├── Tabs
  ├── Main content
  └── Footer

Lottery.css (composants loterie)
  ├── Cartes de tirage
  ├── Boules de numéros
  ├── Jackpot
  └── États (loading, error)

Calendar.css (calendrier)
  ├── Grille calendrier
  ├── Cellules de jours
  └── Interactions

Pagination.css (pagination)
  ├── Contrôles
  ├── Boutons de page
  └── Filtre par mois

DrawDetailsModal.css (modal)
  ├── Overlay
  ├── Contenu modal
  └── Tableau des gains
```

---

## 🔧 Scripts NPM

```json
{
  "dev": "vite",              // Démarrage dev
  "build": "vite build",      // Build production
  "preview": "vite preview"   // Prévisualisation build
}
```

---

## 💾 Format des Données

### resultats-cache.json
```json
{
  "euromillions": [
    {
      "id": "euromillions-2025-01-21",
      "date": "2025-01-21",
      "day": "Mardi",
      "numbers": [13, 35, 39, 44, 47],
      "stars": [3, 5],
      "jackpot": "38 000 000 €",
      "winningsDistribution": [...]
    }
  ],
  "loto": [...]
}
```

---

## 🎯 Fonctionnalités Principales

### ✅ Scraping Automatique
- Récupère les derniers résultats depuis FDJ
- Parse les numéros, étoiles, jackpot
- Extrait la répartition des gains

### ✅ Interface Moderne
- Design inspiré du site FDJ officiel
- Animations fluides (boules, cartes, jackpot)
- Responsive (mobile, tablette, desktop)

### ✅ Navigation Intuitive
- Vue liste simple (5 derniers tirages)
- Vue pagination (tous les tirages par mois)
- Vue calendrier (sélection par date)

### ✅ Détails Complets
- Modal avec informations complètes
- Tableau de répartition des gains
- Nombre de gagnants par rang

---

## 🔒 Sécurité

- Pas de données sensibles stockées
- Scraping éthique (respect robots.txt)
- Cache local pour réduire les requêtes
- CORS configuré correctement

---

## 🚀 Déploiement

### Build Production
```bash
npm run build
```
Génère un dossier `dist/` prêt pour déploiement.

### Déploiement Recommandé
- **Frontend** : Vercel, Netlify, GitHub Pages
- **Backend** : Heroku, Railway, DigitalOcean
- **Données** : Fichier JSON ou base de données

---

## 📈 Évolutions Possibles

- [ ] Base de données (PostgreSQL, MongoDB)
- [ ] Authentification utilisateur
- [ ] Favoris et alertes personnalisées
- [ ] Statistiques avancées
- [ ] Export PDF des résultats
- [ ] Notifications push pour nouveaux tirages
- [ ] Mode sombre
- [ ] PWA (Progressive Web App)

---

## 🐛 Dépannage

### Problème : Le serveur ne démarre pas
**Solution** : Vérifier que le port 3001 est libre
```bash
netstat -ano | findstr :3001
```

### Problème : Pas de résultats affichés
**Solution** : Vérifier le cache et le serveur
1. Vérifier `resultats-cache.json` existe
2. Vérifier serveur proxy tourne sur port 3001
3. Consulter la console navigateur (F12)

### Problème : Erreur de scraping
**Solution** : Le site FDJ a peut-être changé
1. Vérifier `scraper-fdj.js`
2. Tester manuellement avec `node scraper-fdj.js`
3. Adapter les sélecteurs CSS si nécessaire

---

## 📞 Support

Pour toute question :
1. Consulter `COMMENT_CA_MARCHE.md`
2. Lire `GUIDE_FINAL.md`
3. Vérifier la console navigateur
4. Tester les scripts manuellement

---

**Projet maintenu avec ❤️ | Scraping éthique et responsable | FDJ® est une marque déposée**

