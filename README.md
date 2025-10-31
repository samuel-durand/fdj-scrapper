# 🎰 Résultats des Loteries

Application React moderne pour afficher les résultats des loteries françaises (EuroMillions, Loto et EuroDreams).

## 🌐 Démo en ligne

> **🎉 Prévisualisez l'application en direct !**  
> 👉 **[http://resultat-fdj.soqe8286.odns.fr/](http://resultat-fdj.soqe8286.odns.fr/)**

L'application est hébergée sur **o2switch** avec mise à jour automatique quotidienne via **GitHub Actions** ! 🚀

## 📁 Structure du Projet

```
loterie/
├── 📁 src/              # Frontend React
│   ├── components/      # Composants React
│   ├── services/        # Services API
│   └── contexts/        # Contexts (Auth)
├── 📁 backend/          # Backend Node.js + Express + MongoDB
│   ├── models/          # Modèles Mongoose
│   ├── routes/          # Routes API
│   └── middleware/      # Middlewares (auth, admin)
├── 📁 scrapers/         # Scrapers FDJ (Puppeteer)
│   └── scraper-tirage-du-jour.js ⭐ (Principal)
├── 📁 scripts/          # Scripts utilitaires (.bat, .ps1)
├── 📁 utils/            # Utilitaires de cache
├── 📁 docs/             # Documentation complète
└── 📄 resultats-cache.json  # Cache des résultats
```

## ✨ Fonctionnalités

### 🎰 Résultats des Loteries
- ⭐ Affichage des résultats de l'**EuroMillions** avec My Million
- 🍀 Affichage des résultats du **Loto** avec 2ème tirage et Joker+
- 💤 Affichage des résultats d'**EuroDreams** (avec fond blanc élégant)
- 📅 Calendrier interactif pour naviguer entre les résultats
- 📊 **Répartition complète des gains** pour chaque tirage
- 🔄 Navigation par onglets entre les 3 loteries

### 📊 Statistiques & Générateur (NOUVEAU!)
- 📈 **Statistiques avancées** : Top 10 numéros chauds/froids pour chaque jeu
- 🎲 **Générateur de numéros intelligent** avec 4 modes :
  - 🔥 Numéros Chauds (les plus sortis)
  - ❄️ Numéros Froids (les moins sortis)
  - ⚖️ Équilibré (mix chauds/froids)
  - 🎰 Aléatoire (pur hasard)
- 💾 **Sauvegarde des combinaisons** dans votre compte
- 📜 **Historique des combinaisons** avec vérification des gains

### 👤 Espace Utilisateur (NOUVEAU!)
- 🔐 **Authentification sécurisée** (JWT + mots de passe hashés)
- 👤 **Profil personnalisé** avec préférences de jeux
- 🔔 **Alertes personnalisées** pour les tirages (jackpot, jeu favori, etc.)
- 📬 **Centre de notifications** pour suivre les nouveaux tirages
- 🎲 **Gestion des combinaisons** sauvegardées

### 🔐 Panel Administrateur (NOUVEAU!)
- 👥 **Gestion des utilisateurs** (activation, rôles, suppression)
- 📊 **Statistiques globales** de la plateforme
- 🎲 **Consultation des combinaisons** de tous les utilisateurs
- 🔔 **Gestion des alertes** système

### ⚡ Scraping Intelligent
- 🚀 **Scraper ultra-rapide** : ne scrape que les tirages du jour (95% plus rapide!)
- 📡 **Récupération automatique** via GitHub Actions à 22h30
- 🔄 **Mise à jour quotidienne** automatique sur o2switch
- 📱 Interface responsive et moderne
- 🎨 Design unique pour chaque jeu avec animations

## 🚀 Installation

### Prérequis

- Node.js (version 16 ou supérieure)
- npm ou yarn

### Étapes d'installation

1. Ouvrez un terminal dans le dossier du projet

2. Installez les dépendances :
```bash
npm install
```

3. Lancez le serveur de développement :
```bash
npm run dev
```

4. Ouvrez votre navigateur et accédez à l'URL affichée dans le terminal (généralement http://localhost:5173)

## 📦 Scripts disponibles

### Application Frontend
- `npm run dev` - Lance le serveur de développement React
- `npm run build` - Compile l'application pour la production
- `npm run preview` - Prévisualise la version de production

### Backend (dans le dossier backend/)
- `npm run dev` - Lance le serveur backend (port 5000)
- `npm run create-admin` - Crée un utilisateur administrateur

### Scraping
- `npm run scrape-today` - 🆕 **Scraper intelligent** (tirage du jour uniquement - ULTRA RAPIDE!)
- `npm run scrape-complet` - Scrape les 3 jeux sur plusieurs mois
- `npm run scrape` - Scrape les derniers résultats (Puppeteer)
- `npm run scrape-eurodreams` - Scrape uniquement EuroDreams
- `npm run update-cache` - Met à jour le cache des 3 derniers mois
- `npm run nettoyer-cache` - Nettoie le cache des données invalides

## 🎯 Utilisation

### Démarrage rapide (Frontend uniquement)

1. **Récupérer les résultats** (première utilisation) :
   ```bash
   npm run scrape-today  # Scrape les tirages du jour (rapide!)
   ```

2. **Lancer l'application** :
   ```bash
   npm run dev
   ```

3. **Ouvrir dans le navigateur** : `http://localhost:5173`

### Démarrage complet (avec Backend)

1. **Installer les dépendances** :
   ```bash
   # Frontend
   npm install
   
   # Backend
   cd backend
   npm install
   ```

2. **Configurer MongoDB** :
   - Installer MongoDB localement OU utiliser MongoDB Atlas (gratuit)
   - Créer le fichier `backend/.env` :
   ```env
   MONGODB_URI=mongodb://localhost:27017/loterie-fdj
   JWT_SECRET=votre_secret_super_securise
   PORT=5000
   FRONTEND_URL=http://localhost:5173
   ```

3. **Créer un utilisateur admin** :
   ```bash
   cd backend
   npm run create-admin
   ```

4. **Démarrer le backend** :
   ```bash
   cd backend
   npm run dev  # Démarre sur http://localhost:5000
   ```

5. **Démarrer le frontend** (dans un autre terminal) :
   ```bash
   npm run dev  # Démarre sur http://localhost:5173
   ```

6. **Accéder à l'application** :
   - Frontend : `http://localhost:5173`
   - Backend API : `http://localhost:5000`
   - Panel Admin : Se connecter avec le compte admin → Cliquer sur 🔐

### Navigation

1. **3 onglets disponibles** :
   - ⭐ **EuroMillions - My Million** (Mardi & Vendredi)
   - 🍀 **Loto®** (Lundi, Mercredi & Samedi)
   - 💤 **EuroDreams** (Lundi & Jeudi)

2. **Calendrier interactif** :
   - 🔵 Jours bleus = Jours de tirage
   - 🟢 Jours verts = Résultats disponibles (cliquez !)
   - Naviguez entre les mois avec ◀ ▶

3. **Affichage par jeu** :
   - **EuroMillions** : 5 nums + 2 étoiles + Code My Million
   - **Loto** : 5 nums + N° Chance + 2ème tirage + Joker+
   - **EuroDreams** : 6 nums + Dream Number

4. **Modal de détails** :
   - Cliquez sur "Voir les détails complets"
   - Répartition complète des gains
   - Tous les codes gagnants

## 🔧 Configuration API

### Mode par défaut - Parsing JSON Intelligent ✨

L'application utilise maintenant un **système intelligent** avec plusieurs stratégies :

1. **Multi-endpoints** : Teste automatiquement plusieurs URLs
2. **Parsing JSON direct** : Si l'API JSON existe
3. **Extraction HTML** : Parse le HTML pour trouver le JSON embarqué (`__NEXT_DATA__`, etc.)
4. **Fallback** : Affiche des données de secours si tout échoue

Si l'API n'est pas disponible (problème CORS ou autre), elle affiche des données de secours.

### Utiliser le serveur proxy (Recommandé)

Pour contourner les restrictions CORS et récupérer les vraies données :

1. Installez les dépendances du proxy :
```bash
npm install --save-dev express cors node-fetch
```

2. Lancez le serveur proxy :
```bash
node server-proxy-example.js
```

3. Modifiez `src/services/lotteryService.js` :
```javascript
const FDJ_API_BASE = 'http://localhost:3001/api';
```

4. Dans un autre terminal, lancez l'application React :
```bash
npm run dev
```

### Documentation complète

Consultez :
- **`GUIDE_PARSING_JSON.md`** - 🆕 Guide complet sur le parsing JSON et extraction HTML
- **`INTEGRATION_API.md`** - Comprendre le fonctionnement de l'API
- **`DEMARRAGE_RAPIDE.md`** - Guide de démarrage rapide

Couvre :
- Comment fonctionne le parsing JSON multi-format
- Solutions aux problèmes CORS
- Options d'intégration avancées
- Formats de données supportés
- Test des endpoints avec `test-api-fdj.js`

### Modifier les couleurs

Les couleurs principales sont définies dans `src/index.css` avec les variables CSS :
- `--primary-blue` : Couleur principale bleue
- `--primary-gold` : Couleur dorée
- `--primary-green` : Couleur verte
- etc.

## 🎮 Jeux disponibles

| Jeu | Tirages | Format | Caractéristiques |
|-----|---------|--------|------------------|
| ⭐ **EuroMillions** | Mar & Ven 20h30 | 5 nums (1-50) + 2 étoiles (1-12) | Code My Million inclus |
| 🍀 **Loto** | Lun, Mer & Sam 20h30 | 5 nums (1-49) + N° Chance (1-10) | 2ème tirage + Joker+ |
| 💤 **EuroDreams** | Lun & Jeu 21h00 | 6 nums (1-40) + Dream (1-5) | Rente 20 000€/mois |

**📊 Total : 7 tirages par semaine** (~30 tirages/mois)

Consultez **`JEUX_DISPONIBLES.md`** pour plus de détails sur chaque jeu.

## 📁 Structure du projet

```
loterie/
├── 📂 src/                        # Code source React
│   ├── components/                # Composants React
│   │   ├── Euromillions.jsx      # Composant EuroMillions
│   │   ├── Loto.jsx              # Composant Loto
│   │   ├── Eurodreams.jsx        # Composant EuroDreams
│   │   ├── Calendar.jsx          # Calendrier interactif
│   │   ├── Pagination.jsx        # Navigation entre pages
│   │   ├── DrawDetailsModal.jsx  # Modal détails complets
│   │   └── Lottery.css           # Styles des composants
│   ├── services/                 # Services API
│   │   └── lotteryService.js     # Récupération des résultats
│   ├── App.jsx                   # Composant principal
│   ├── App.css                   # Styles globaux
│   ├── main.jsx                  # Point d'entrée
│   └── index.css                 # Styles de base
│
├── 📂 docs/                       # Documentation (28 fichiers)
│   ├── README.md                 # Index de la documentation
│   ├── DEMARRAGE_RAPIDE.md      # Guide de démarrage
│   ├── JEUX_DISPONIBLES.md      # Les 3 jeux
│   ├── STRUCTURE_PROJET.md      # Architecture
│   └── ... (24 autres guides)
│
├── 📂 scripts/                    # Scripts batch Windows (16 fichiers)
│   ├── README.md                 # Guide des scripts
│   ├── start-app.bat            # Lancer l'application
│   ├── scrape-eurodreams.bat    # Scraper EuroDreams
│   ├── push-to-github.bat       # Push vers GitHub
│   └── ... (12 autres scripts)
│
├── 📂 utils/                      # Scripts utilitaires (7 fichiers)
│   ├── README.md                 # Guide des utilitaires
│   ├── fix-eurodreams-jackpot.js # Correction jackpots
│   ├── nettoyer-cache.js        # Nettoyage cache
│   ├── update-cache-3-mois.js   # Mise à jour cache
│   └── ... (anciens scrapers)
│
├── 📄 scraper-urls-directes.js   # ⭐ Scraper principal (3 jeux)
├── 📄 scraper-eurodreams.js      # Scraper EuroDreams
├── 📄 scraper-puppeteer.js       # Scraper récents
├── 📄 server-proxy-example.js    # Serveur proxy (optionnel)
├── 📄 resultats-cache.json       # Cache des résultats
├── 📄 package.json               # Dépendances npm
├── 📄 vite.config.js             # Configuration Vite
├── 📄 .gitignore                 # Fichiers à ignorer
└── 📄 README.md                  # Ce fichier
```

## 🌐 Récupération des Résultats

### Système de Scraping

L'application utilise **Puppeteer** pour scraper les résultats officiels FDJ :

1. **Scraper principal** (`scraper-urls-directes.js`) :
   - Génère les URLs directes pour chaque tirage
   - Scrape EuroMillions, Loto et EuroDreams
   - Stocke dans `resultats-cache.json`

2. **Données extraites** :
   - Numéros gagnants complets
   - Codes spéciaux (My Million, Joker+, Dream Number)
   - Jackpots/Rentes
   - Répartition complète des gains

3. **Utilisation** :
   ```bash
   # Récupérer 3 mois de tous les jeux
   node scraper-urls-directes.js 3
   
   # Seulement EuroDreams
   npm run scrape-eurodreams
   
   # Avec fichier batch Windows
   recuperer-historique-complet.bat
   ```

### Cache des résultats

- **Fichier** : `resultats-cache.json`
- **Format** : JSON structuré par jeu
- **Mise à jour** : Manuelle via les scrapers
- **Nettoyage** : `npm run nettoyer-cache`

## 🌐 Déploiement

### Déploiement sur o2switch

> 🚀 **Tu as déjà un serveur o2switch ?** → Suis le guide rapide : [`docs/DEPLOIEMENT-IMMEDIAT-O2SWITCH.md`](docs/DEPLOIEMENT-IMMEDIAT-O2SWITCH.md)

Pour héberger ton application sur **o2switch** :

#### 1. Build de production

```bash
npm run build
```

Cela crée un dossier `dist/` avec tous les fichiers optimisés.

#### 2. Upload vers o2switch

**Via FTP/SFTP** (FileZilla ou WinSCP) :
- Connecte-toi à o2switch
- Upload le contenu de `dist/` vers `/home/ton-user/www/`
- Ton site est en ligne ! 🎉

#### 3. Mise à jour des résultats

**Option A - Manuelle** (recommandée) :
```bash
# Depuis ton PC Windows
.\scripts\update-et-upload.bat
```
- Scrape les résultats
- Upload `resultats-cache.json` via FTP

**Option B - Automatique** (avec WinSCP configuré) :
```bash
# Mise à jour et upload automatique
.\scripts\auto-update-o2switch.bat
```

**Option C - Tâche planifiée Windows** :
- Configure le Planificateur de tâches
- Exécute `auto-update-o2switch.bat` tous les jours à 22h
- Les résultats se mettent à jour automatiquement !

#### 4. Configuration o2switch

- **SSL gratuit** : Active Let's Encrypt dans cPanel
- **Compression** : Déjà configurée via `.htaccess`
- **Cache** : Configuré pour CSS/JS (1 an)

> 📖 **Guide complet** : Voir [`docs/DEPLOIEMENT-O2SWITCH.md`](docs/DEPLOIEMENT-O2SWITCH.md)

### Autres hébergeurs

L'application est **100% statique** après le build :
- ✅ Netlify, Vercel, GitHub Pages
- ✅ Apache, Nginx
- ✅ Tout hébergeur supportant HTML/CSS/JS

**Note** : Les scrapers Puppeteer doivent tourner sur ton PC ou un serveur dédié (pas sur hébergement mutualisé).

## 🎨 Technologies utilisées

### Frontend
- **React 18** - Framework UI moderne
- **Vite** - Build tool ultra-rapide
- **CSS3** - Animations et gradients
- **Context API** - Gestion d'état global
- **Fetch API** - Communication avec l'API

### Backend (Optionnel)
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **MongoDB** - Base de données NoSQL
- **Mongoose** - ODM pour MongoDB
- **JWT** - Authentification sécurisée
- **Bcrypt** - Hashage des mots de passe
- **CORS** - Gestion des origines croisées

### Scraping
- **Puppeteer** - Scraping headless browser
- **GitHub Actions** - Automatisation CI/CD
- **FTP Deploy** - Déploiement automatique

## 📝 Notes

- ✅ L'application scrape les résultats **réels et officiels** depuis fdj.fr
- 🎯 **3 jeux disponibles** : EuroMillions, Loto, EuroDreams
- 📱 Interface **100% responsive** (mobile, tablette, desktop)
- 🎨 **Design unique** pour chaque jeu avec animations
- 📊 **Historique complet** disponible via scraping
- ⚠️ Les données sont à titre **indicatif uniquement**
- 🔞 Pour un usage en production, consultez les sources officielles
- ✅ Respectez les conditions d'utilisation du site FDJ

## ⚠️ Limitations

- Le scraping nécessite Puppeteer (navigateur headless)
- Les tirages du jour peuvent ne pas être disponibles avant 21h30
- Le scraping de longues périodes peut prendre du temps
- Pour un usage commercial, contactez la FDJ pour un accès officiel

## 📚 Documentation complète

Pour plus de détails, consultez le dossier **`docs/`** :

- **[DEMARRAGE_RAPIDE.md](docs/DEMARRAGE_RAPIDE.md)** - Guide de démarrage rapide
- **[JEUX_DISPONIBLES.md](docs/JEUX_DISPONIBLES.md)** - Détails sur les 3 jeux
- **[AJOUT_EURODREAMS.md](docs/AJOUT_EURODREAMS.md)** - Guide complet EuroDreams
- **[STRUCTURE_PROJET.md](docs/STRUCTURE_PROJET.md)** - Architecture détaillée
- **[CHANGELOG_EURODREAMS.md](docs/CHANGELOG_EURODREAMS.md)** - Historique v2.0
- **[GUIDE_UTILISATION.md](docs/GUIDE_UTILISATION.md)** - Guide d'utilisation
- **[COMMENT_CA_MARCHE.md](docs/COMMENT_CA_MARCHE.md)** - Fonctionnement technique
- **[DEPLOY-RENDER.md](DEPLOY-RENDER.md)** - 🚀 Déploiement sur Render (5 min)

<details>
<summary>📖 Voir toute la documentation disponible</summary>

### Guides de démarrage
- [DEMARRAGE_RAPIDE.md](docs/DEMARRAGE_RAPIDE.md) - Démarrage en 5 minutes
- [GUIDE_UTILISATION.md](docs/GUIDE_UTILISATION.md) - Utilisation complète
- [START_ICI.md](docs/START_ICI.md) - Point de départ

### Jeux et fonctionnalités
- [JEUX_DISPONIBLES.md](docs/JEUX_DISPONIBLES.md) - EuroMillions, Loto, EuroDreams
- [AJOUT_EURODREAMS.md](docs/AJOUT_EURODREAMS.md) - Ajout d'EuroDreams
- [INTERFACE_MISE_A_JOUR.md](docs/INTERFACE_MISE_A_JOUR.md) - Mises à jour UI

### Technique
- [STRUCTURE_PROJET.md](docs/STRUCTURE_PROJET.md) - Architecture du projet
- [COMMENT_CA_MARCHE.md](docs/COMMENT_CA_MARCHE.md) - Fonctionnement du scraping
- [GUIDE_PUPPETEER.md](docs/GUIDE_PUPPETEER.md) - Utilisation de Puppeteer
- [COMPARAISON_SCRAPERS.md](docs/COMPARAISON_SCRAPERS.md) - Comparaison des solutions

### Git et déploiement
- [GUIDE_GIT_COMPLET.md](docs/GUIDE_GIT_COMPLET.md) - Guide Git complet
- [SECURITE_GITHUB.md](docs/SECURITE_GITHUB.md) - Sécurité et bonnes pratiques
- [DEPLOY-RENDER.md](DEPLOY-RENDER.md) - 🚀 Guide de déploiement sur Render
- [backend/DEPLOY.md](backend/DEPLOY.md) - Guide de déploiement backend détaillé

### Historique et changelog
- [CHANGELOG_EURODREAMS.md](docs/CHANGELOG_EURODREAMS.md) - Version 2.0
- [CORRECTIONS_APPLIQUEES.md](docs/CORRECTIONS_APPLIQUEES.md) - Corrections

</details>

## 📄 Licence

Ce projet est libre d'utilisation pour un usage personnel ou éducatif.

---

## 🎉 Version 2.0 - EuroDreams

**Nouveauté** : EuroDreams est maintenant disponible ! 💤

L'application propose désormais **3 jeux complets** :
- ⭐ EuroMillions avec My Million
- 🍀 Loto avec 2ème tirage et Joker+
- 💤 EuroDreams avec rente mensuelle

**7 tirages par semaine** pour ne rien manquer ! 🎰

---

Fait avec ❤️ pour les amateurs de loteries

"# fdj-scrapper" 
