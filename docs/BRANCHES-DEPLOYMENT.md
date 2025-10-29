# Configuration des Branches pour le Déploiement

## Vue d'ensemble

Le projet utilise deux branches Git pour séparer le déploiement du backend et du frontend :

### 🌳 Branche `main` - Développement et Frontend
- **Contenu** : Code complet (frontend React + backend Node.js)
- **Usage** : Développement local et déploiement du frontend sur O2Switch
- **Déploiement** : O2Switch (fichiers statiques build Vite)

### 🌳 Branche `backend` - Backend uniquement
- **Contenu** : Seulement le code backend Node.js/Express
- **Usage** : Déploiement automatique sur Render
- **Déploiement** : Render (service Node.js)

## Structure de la branche `backend`

La branche `backend` contient **uniquement** :

```
├── middleware/          # Middlewares Express (auth)
├── models/             # Modèles MongoDB (User, Alert, Combination, Notification)
├── routes/             # Routes API (auth, alerts, combinations, users, admin)
├── scripts/            # Scripts utilitaires (create-admin.js)
├── server.js           # Point d'entrée du serveur Express
├── package.json        # Dépendances backend uniquement
├── render.yaml         # Configuration Render
├── README.md           # Documentation backend
└── DEPLOY.md           # Guide de déploiement rapide
```

**Fichiers supprimés** (par rapport à `main`) :
- `src/` - Code React du frontend
- `public/` - Fichiers statiques frontend
- `docs/` - Documentation projet
- `scrapers/` - Scripts de scraping FDJ
- `utils/` - Utilitaires
- `scripts/` (sauf create-admin.js)
- `vite.config.js`, `index.html` - Configuration Vite

## Configuration sur Render

### 1. Déploiement automatique

Le fichier `render.yaml` configure automatiquement Render :
- **Build Command** : `npm install`
- **Start Command** : `node server.js`
- **Runtime** : Node

### 2. Variables d'environnement (Secrets)

Les secrets sont configurés **directement sur Render Dashboard**, pas dans le code :

**Dashboard Render** → **Environment** → **Add Environment Variable** :

| Variable | Exemple |
|----------|---------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/loterie-fdj` |
| `JWT_SECRET` | `(clé générée de 32+ caractères)` |
| `FRONTEND_URL` | `https://votre-domaine.o2switch.com` |

**Avantages** :
- ✅ Secrets jamais dans le code Git
- ✅ Facile à modifier sans toucher au code
- ✅ Différentes configs par environnement
- ✅ Sécurité maximale

### 3. MongoDB Atlas

1. Créez un cluster gratuit M0 sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. **Database Access** : Créez un utilisateur
3. **Network Access** : Ajoutez `0.0.0.0/0` (autoriser Render)
4. Copiez l'URI et ajoutez-le dans les variables Render

## Configuration sur O2Switch (Frontend)

La branche `main` reste utilisée pour le frontend.

### 1. Configuration de l'API

Créez un fichier `.env.production` dans le projet (branche main) :

```env
VITE_API_URL=https://votre-service.onrender.com/api
```

### 2. Build et déploiement

```bash
npm run build
# Uploadez le contenu de dist/ sur O2Switch
```

## Workflow de mise à jour

### Mettre à jour le backend

```bash
# 1. Sur la branche main, modifiez le code backend
git checkout main
# ... modifications dans backend/ ...
git add backend/
git commit -m "Update backend"
git push origin main

# 2. Synchronisez avec la branche backend
git checkout backend
git merge main
git push origin backend
```

Render redéploie automatiquement après le push ! ✨

### Mettre à jour le frontend

```bash
# Restez sur main
git checkout main
# ... modifications dans src/ ...
git add src/
git commit -m "Update frontend"
git push origin main

# Build et déploiement
npm run build
# Uploadez dist/ sur O2Switch
```

## Test de déploiement

### Backend (Render)

```bash
curl https://votre-service.onrender.com/api/health
```

Réponse attendue :
```json
{"status":"OK","message":"Server is running"}
```

### Frontend (O2Switch)

Ouvrez votre domaine O2Switch et vérifiez :
- ✅ L'application se charge
- ✅ Les appels API fonctionnent
- ✅ Pas d'erreurs CORS dans la console

## Résolution de problèmes

### Backend : Render ne démarre pas
➜ Vérifiez les logs sur Render Dashboard  
➜ Vérifiez que toutes les variables d'environnement sont définies  
➜ Vérifiez MongoDB Atlas Network Access (0.0.0.0/0)

### Frontend : Erreurs CORS
➜ `FRONTEND_URL` sur Render doit correspondre exactement à votre domaine O2Switch  
➜ Utilisez HTTPS (pas HTTP)  
➜ Vérifiez la console navigateur pour détails

### Backend : Service en veille (plan gratuit)
➜ Render met le service en veille après 15 min d'inactivité  
➜ Premier appel : 30-60 secondes de délai  
➜ Solution : Utilisez [UptimeRobot](https://uptimerobot.com) pour ping toutes les 5-10 min

## Avantages de cette architecture

✅ **Déploiements indépendants** : Backend et frontend séparés  
✅ **Sécurité** : Secrets gérés par Render, jamais dans Git  
✅ **Simplicité** : Pas de fichiers .env dans le repo backend  
✅ **Performance** : Render optimisé pour Node.js, O2Switch pour fichiers statiques  
✅ **Coûts** : Plans gratuits (Render + O2Switch)  
✅ **Évolutivité** : Facile d'ajouter des services

## Commandes utiles

```bash
# Voir les branches
git branch -a

# Comparer les branches
git diff main..backend

# Créer un admin (localement ou sur Render via SSH)
node scripts/create-admin.js

# Tester l'API Render
curl https://votre-service.onrender.com/api/health
```

## Documentation

| Fichier | Branche | Description |
|---------|---------|-------------|
| `README.md` | `backend` | Documentation backend complète |
| `DEPLOY.md` | `backend` | Guide déploiement rapide |
| `docs/BRANCHES-DEPLOYMENT.md` | `main` | Ce document |
| `render.yaml` | `backend` | Configuration Render |

---

**Dernière mise à jour** : Octobre 2025  
**Workflow simplifié** : Secrets sur Render Dashboard, pas dans le code
