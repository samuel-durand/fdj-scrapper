# 🎰 Résultats des Loteries FDJ

Application web pour consulter les résultats de tous les jeux de tirage FDJ — **EuroMillions**,
**Loto**, **EuroDreams**, **Keno**, **Crescendo** et **Amigo** : front React (Vite) + API Python (Flask)
+ MongoDB. Les tirages sont récupérés automatiquement depuis le site de la FDJ (requêtes HTTP,
sans navigateur) et stockés en base.

## 🎲 Jeux couverts

| Jeu | Tirages | Résultats affichés |
|---|---|---|
| **EuroMillions** | mardi et vendredi | 5 numéros + 2 étoiles, code My Million, répartition France / Europe, Étoile+ |
| **Loto** | lundi, mercredi, samedi (+ Super / Grand Loto) | 5 numéros + numéro chance, 2ᵉ tirage, Joker+, codes gagnants |
| **EuroDreams** | lundi et jeudi | 6 numéros + Dream Number, rente mensuelle |
| **Keno** | chaque soir | 16 numéros sur 56, Multiplicateur, Joker+, barème des gains selon la mise |
| **Crescendo** | samedi, chaque heure de 13h à 19h | 10 numéros sur 25 + lettre, jackpot, gagnants par rang |
| **Amigo** | toutes les 5 minutes | 7 numéros bleus + 5 jaunes sur 28, barème des gains |

## ✨ Fonctionnalités

### Résultats
- Dernier tirage, **prochain tirage** avec jackpot et compte à rebours avant la fin des prises de jeu
- Navigation entre les tirages (flèches, liste, **calendrier**, **historique**), heure affichée pour
  Crescendo et Amigo
- **Répartition des gains** (nombre de gagnants par rang) ou **barème** pour les jeux à gains fixes
- **Statistiques** : graphiques Chart.js, numéros chauds / froids et générateur de combinaisons
  (EuroMillions, Loto, EuroDreams) ; fréquences de sortie pour Keno, Crescendo et Amigo

### Interface
- **Scène 3D (three.js)** propre à chaque jeu : ciel étoilé et étoiles dorées (EuroMillions), boules
  qui rebondissent (Loto), boules en verre dans la brume (EuroDreams), etc. Transition animée entre
  les jeux, parallaxe à la souris, la scène recule quand on descend vers les données
- **Animation du tirage** : les boules quittent la scène et viennent se poser sur les numéros
- **Interface en verre dépoli** au-dessus de la scène, **thème clair / sombre**, responsive
- Sans WebGL, en mode « réduire les animations » ou économie de données : dégradé statique aux
  couleurs du jeu. three.js n'est chargé qu'à la demande (chunk séparé) et la qualité du rendu
  s'adapte à la puissance de l'appareil

### Espace utilisateur
- Compte (JWT), profil, jeux favoris et onglet par défaut
- **Combinaisons sauvegardées** avec vérification des gains
- **Alertes** (jackpot, numéros favoris, nouveau tirage…) évaluées côté serveur à chaque tirage →
  centre de notifications

### Administration
- Tableau de bord (indicateurs, activité sur 30 jours, statistiques mensuelles, répartition par jeu)
- Gestion des utilisateurs (rôle, activation, suppression), des combinaisons et des alertes
- Thème clair / sombre, comme le reste du site

### Récupération des résultats
- Scraper **sans navigateur** : lecture des données embarquées dans les pages fdj.fr
- **Worker** calé sur le calendrier de chaque jeu (heure annoncée par la FDJ, nouvel essai tant que
  le résultat n'est pas publié) ; Amigo est récupéré par passages groupés toutes les 15 min
- Rattrapage automatique des tirages manquants ou incomplets
- API avec cache HTTP (ETag) et **compression gzip** ; le front ne charge que le jeu affiché

## 📁 Structure

```
├── src/                  Front React
│   ├── components/       Results, Background (scène 3D), Statistics, Auth, Alerts, MyCombinations, Admin…
│   ├── three/            Scène three.js (lotteryScene.js)
│   ├── services/         Appels à l'API (/api)
│   ├── contexts/         AuthContext
│   └── games.js          Configuration des 6 jeux
├── backend/              API Flask + MongoDB (voir backend/README.md)
│   ├── app/routes/       auth, users, draws, combinations, alerts, notifications, admin
│   ├── app/scraper/      Scraper FDJ (games.py : normalisation de chaque jeu)
│   ├── app/worker.py     Mise à jour automatique après chaque tirage
│   ├── manage.py         Commandes (run, scrape, worker, create-admin, import-json)
│   └── tests/            Tests (MongoDB simulée)
├── .github/workflows/    Scraping planifié via GitHub Actions
├── render.yaml           Déploiement Render
└── railway.json + nixpacks.toml   Déploiement Railway
```

## 🚀 Installation

Prérequis : **Node.js 18+**, **Python 3.11+** et une base **MongoDB** (ex. MongoDB Atlas).

Pour une base locale sous Windows :

```bash
winget install MongoDB.Server   # service Windows « MongoDB » sur le port 27017
winget install MongoDB.Shell    # mongosh, pour consulter la base
```

puis `MONGODB_URI=mongodb://127.0.0.1:27017/loterie` dans `backend/.env`.

```bash
# Front
npm install

# Backend
python -m venv .venv
.venv\Scripts\activate              # Windows — sinon : source .venv/bin/activate
pip install -r backend/requirements.txt
copy backend\.env.example backend\.env   # puis renseigner MONGODB_URI et les secrets JWT
```

### Variables d'environnement (`backend/.env`)

| Variable | Rôle |
|---|---|
| `MONGODB_URI` | Connexion MongoDB (obligatoire) |
| `MONGODB_DB` | Nom de la base si absent de l'URI (défaut `loterie`) |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Secrets de signature des jetons |
| `JWT_EXPIRE` / `JWT_REFRESH_EXPIRE` | Durées de validité (défaut `7d` / `30d`) |
| `APP_ENV` | `development` ou `production` |
| `FRONTEND_URL` | Origines CORS autorisées (séparées par des virgules) |
| `SERVE_FRONTEND` | Flask sert `dist/` : `auto`, `true` ou `false` |

Côté front, `VITE_API_URL` permet de pointer vers une API externe (défaut : `/api`).

## 🧑‍💻 Développement

Dans deux terminaux :

```bash
npm run backend     # API sur http://127.0.0.1:5000
npm run dev         # Front sur http://localhost:5173 (/api est redirigé vers Flask)
```

Premier lancement :

```bash
npm run scrape                                                      # récupère les tirages
python backend/manage.py create-admin "Nom" email@exemple.fr "motdepasse"
python backend/manage.py import-json backend/data/ancien-resultats-cache.json   # historique (une fois)
```

La FDJ ne publie qu'environ deux mois de résultats : `import-json` reprend l'historique
de l'ancien fichier de cache.

Amigo compte environ 200 tirages par jour : son historique est limité à 7 jours
(`history_days` dans `backend/app/scraper/games.py`).

## 📦 Scripts npm

| Commande | Action |
|---|---|
| `npm run dev` | Serveur de développement Vite |
| `npm run build` | Build du front dans `dist/` |
| `npm run preview` | Prévisualise le build |
| `npm run backend` | Lance l'API Flask en mode debug |
| `npm run scrape` | Met à jour les tirages (+ alertes) |
| `npm run worker` | Worker de mise à jour continue |
| `npm run test:backend` | Tests du backend (`pip install -r backend/requirements-dev.txt`) |

## 🌐 Déploiement

Un seul service suffit : Flask sert l'API **et** le front compilé.

```bash
npm run build
SERVE_FRONTEND=true gunicorn --chdir backend wsgi:app --bind 0.0.0.0:$PORT --workers 2
```

### Render + MongoDB Atlas (gratuit)

1. **MongoDB Atlas** : créer un cluster gratuit (M0), un utilisateur, autoriser `0.0.0.0/0` dans
   *Network Access* et copier l'URI de connexion.
2. **Render** : *New → Blueprint* sur ce dépôt. [`render.yaml`](render.yaml) crée le service web
   (offre gratuite, branche `main`) ; renseigner `MONGODB_URI`, les secrets JWT sont générés.
3. **GitHub** : ajouter le secret `MONGODB_URI` (*Settings → Secrets and variables → Actions*).
   La GitHub Action [`update-fdj.yml`](.github/workflows/update-fdj.yml) met à jour les tirages
   toutes les 15 min (remplace le worker, payant sur Render).
4. **Premier remplissage** : lancer l'action à la main (onglet *Actions* → *Run workflow*), puis en
   local avec `MONGODB_URI` pointant vers Atlas : `import-json` (historique) et `create-admin`.

Sur l'offre gratuite, le service s'endort après ~15 min sans visite : le premier chargement suivant
prend 30 à 60 s.

### Autres hébergeurs

- **Railway** : `railway.json` + `nixpacks.toml` (le worker se lance comme second service avec
  `python backend/manage.py worker`).
- Tout hébergeur avec un process permanent peut lancer `python backend/manage.py worker` à la place
  de la GitHub Action.

## 📚 Documentation

Détails de l'API, compatibilité avec l'ancien backend et commandes : [backend/README.md](backend/README.md).

---

⚠️ Projet non officiel, sans lien avec la FDJ. Jouer comporte des risques : endettement,
dépendance… Appelez le 09 74 75 13 13 (appel non surtaxé).
