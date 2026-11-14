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
- Navigation entre les tirages (flèches, liste de **toutes les dates depuis 2004** groupées par année,
  **calendrier**, **historique**) : les tirages anciens sont chargés à la demande ; heure affichée pour
  Crescendo et Amigo
- **Répartition des gains** (nombre de gagnants par rang) ou **barème** pour les jeux à gains fixes
- **Statistiques** : graphiques Chart.js, numéros chauds / froids et générateur de combinaisons
  (EuroMillions, Loto, EuroDreams) ; fréquences de sortie pour Keno, Crescendo et Amigo ; calcul sur
  les derniers tirages ou sur **tout l'historique officiel** (EuroMillions depuis 2004, Loto depuis 2008)

### Interface
- **Scène 3D (three.js)** propre à chaque jeu : ciel étoilé et étoiles dorées (EuroMillions), boules
  qui rebondissent (Loto), boules en verre dans la brume (EuroDreams), etc. Transition animée entre
  les jeux, parallaxe à la souris, la scène recule quand on descend vers les données
- **Animation du tirage** : le boulier tourbillonne, les boules gagnantes s'en échappent et viennent se
  poser sur les numéros de la carte
- **Scène interactive** : les boules s'écartent au passage de la souris (ou du doigt) et
  s'entrechoquent ; pluie de pièces d'or 3D au survol du jackpot ; panneau du jackpot en relief qui
  suit le curseur ; sur mobile, la scène suit l'inclinaison du téléphone
- **Interface en verre dépoli** au-dessus de la scène, responsive
- **Thème clair / sombre** : soleil jaune qui se transforme en croissant de lune, nouveau thème qui se
  propage en cercle depuis le bouton ; choix mémorisé sur l'appareil et dans le compte
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
- **Mise à jour automatique dans le serveur web** (pas de worker ni de cron externe) : calendrier de
  chaque jeu (heure annoncée par la FDJ, nouvel essai tant que le résultat n'est pas publié),
  Amigo par passages groupés toutes les 15 min, rattrapage au démarrage
- Rattrapage automatique des tirages manquants ou incomplets
- API avec cache HTTP (ETag) et **compression gzip** ; le front ne charge que le jeu affiché

## 📁 Structure

```
├── src/                  Front React
│   ├── components/       Results, Background (scène 3D), Statistics, Auth, Alerts, MyCombinations, Admin…
│   ├── three/            Scène three.js (lotteryScene.js : boulier, physique, pièces, vols)
│   ├── hooks/            useTheme, useTilt (relief qui suit le curseur)
│   ├── services/         Appels à l'API (/api)
│   ├── contexts/         AuthContext
│   └── games.js          Configuration des 6 jeux
├── backend/              API Flask + MongoDB (voir backend/README.md)
│   ├── app/routes/       auth, users, draws, combinations, alerts, notifications, admin
│   ├── app/scraper/      Scraper FDJ (games.py : normalisation, archives.py : historique officiel)
│   ├── app/autoupdate.py Mise à jour automatique dans le serveur web
│   ├── app/worker.py     Mise à jour automatique après chaque tirage
│   ├── manage.py         Commandes (run, scrape, worker, create-admin, import-archives, import-json)
│   └── tests/            Tests (MongoDB simulée)
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
npm run scrape                                    # tirages récents (≈ 2 derniers mois)
python backend/manage.py import-archives          # historique officiel FDJ (depuis 2004)
python backend/manage.py create-admin "Nom" email@exemple.fr "motdepasse"
```

### Historique officiel FDJ

La FDJ publie l'historique complet de ses jeux en archives CSV (pages « historique » de fdj.fr).
Elles sont importées automatiquement au premier démarrage du serveur, ou à la main :

```bash
python backend/manage.py import-archives --check   # analyse sans rien écrire
python backend/manage.py import-archives
```

Seules les archives aux règles actuelles sont reprises : EuroMillions depuis 2004, Loto depuis 2008
(5 numéros + numéro chance, Super et Grand Loto compris), EuroDreams depuis 2023, Keno et Crescendo
depuis novembre 2025. Un tirage déjà en base n'est jamais remplacé, sauf s'il contredit l'archive
officielle (données erronées de l'ancien cache).

Amigo compte environ 200 tirages par jour : son historique est limité à 7 jours
(`history_days` dans `backend/app/scraper/games.py`).

## 📦 Scripts npm

| Commande | Action |
|---|---|
| `npm run dev` | Serveur de développement Vite |
| `npm run build` | Build du front dans `dist/` |
| `npm run preview` | Prévisualise le build |
| `npm run backend` | Lance l'API Flask en mode debug (`-- --auto-update` : mise à jour des tirages en arrière-plan) |
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
3. **Compte admin** : en local, avec `MONGODB_URI` pointant vers Atlas,
   `python backend/manage.py create-admin …` (et `import-json` pour l'ancien historique).

**Mise à jour des tirages** : elle tourne dans le service web lui-même (`backend/app/autoupdate.py`),
sans worker ni GitHub Action. Une boucle en arrière-plan suit le calendrier de chaque jeu ; au
démarrage, un passage complet remplit ou rattrape la base. Un verrou MongoDB évite que les processus
gunicorn scrapent en même temps.

Sur l'offre gratuite, le service s'endort après ~15 min sans visite et ne met plus rien à jour
pendant ce temps ; la visite suivante le réveille (30 à 60 s) et les tirages manquants sont
rattrapés aussitôt. Pour des alertes toujours à l'heure, un service de « ping » gratuit (UptimeRobot,
cron-job.org…) qui appelle `/api/health` toutes les 10 min le garde éveillé.

### Autres hébergeurs

- **Railway** : `railway.json` + `nixpacks.toml` (le worker se lance comme second service avec
  `python backend/manage.py worker`).
- Avec un process permanent séparé : `python backend/manage.py worker`, et `AUTO_UPDATE=false`
  sur le service web.

## 📚 Documentation

Détails de l'API, compatibilité avec l'ancien backend et commandes : [backend/README.md](backend/README.md).

---

⚠️ Projet non officiel, sans lien avec la FDJ. Jouer comporte des risques : endettement,
dépendance… Appelez le 09 74 75 13 13 (appel non surtaxé).
