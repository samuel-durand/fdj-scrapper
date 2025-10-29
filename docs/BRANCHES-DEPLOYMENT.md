# Configuration des Branches pour le Déploiement

## Vue d'ensemble

Le projet utilise deux branches Git pour séparer le déploiement du backend et du frontend :

### 🌳 Branche `main` - Développement et Frontend
- **Contenu** : Code complet (frontend + backend)
- **Usage** : Développement local et déploiement du frontend sur O2Switch
- **Déploiement** : O2Switch (fichiers statiques du build Vite)

### 🌳 Branche `backend` - Backend uniquement
- **Contenu** : Seulement les fichiers nécessaires au backend Node.js
- **Usage** : Déploiement automatique sur Render
- **Déploiement** : Render (service Node.js)

## Structure de la branche `backend`

La branche `backend` contient uniquement :
```
├── middleware/          # Middlewares Express
├── models/             # Modèles MongoDB (User, Alert, Combination, Notification)
├── routes/             # Routes API (auth, alerts, combinations, users, admin)
├── scripts/            # Scripts utilitaires (create-admin.js)
├── server.js           # Point d'entrée du serveur Express
├── package.json        # Dépendances backend
├── .gitignore          # Fichiers à ignorer
├── README.md           # Documentation backend
├── ENV-CONFIG-RENDER.md # Guide de configuration Render
└── WORKFLOW.md         # Documentation du workflow
```

**Fichiers supprimés** (par rapport à `main`) :
- `src/` - Composants React
- `public/` - Fichiers statiques frontend
- `dist/` - Build frontend
- `docs/` - Documentation projet
- `scrapers/` - Scripts de scraping
- `utils/` - Utilitaires frontend
- `scripts/` (sauf create-admin.js) - Scripts de déploiement
- `index.html`, `vite.config.js` - Configuration Vite

## Configuration Render (branche `backend`)

### 1. Créer le service sur Render

1. Allez sur [render.com](https://render.com)
2. Créez un nouveau **Web Service**
3. Connectez votre repository GitHub : `samuel-durand/fdj-scrapper`
4. **Important** : Sélectionnez la branche **`backend`**

### 2. Configuration du Build

- **Environment** : Node
- **Build Command** : `npm install`
- **Start Command** : `node server.js`
- **Branch** : `backend`

### 3. Variables d'environnement

Ajoutez ces variables dans Render Dashboard → Environment :

| Variable | Exemple | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Mode production |
| `PORT` | `10000` | Port (auto-assigné par Render) |
| `MONGODB_URI` | `mongodb+srv://...` | URI MongoDB Atlas |
| `JWT_SECRET` | `(générer une clé)` | Secret pour JWT (32+ caractères) |
| `FRONTEND_URL` | `https://votre-domaine.o2switch.com` | URL du frontend |

**Générer un JWT Secret** :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. MongoDB Atlas

1. Créez un cluster gratuit sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Database Access : Créez un utilisateur
3. Network Access : Ajoutez `0.0.0.0/0` (autoriser toutes les IPs)
4. Copiez l'URI de connexion dans `MONGODB_URI`

## Configuration O2Switch (branche `main`)

### Frontend avec Vite

1. Configurez l'URL de l'API Render dans votre `.env.production` :
   ```env
   VITE_API_URL=https://votre-service.onrender.com/api
   ```

2. Buildez le frontend :
   ```bash
   npm run build
   ```

3. Uploadez le contenu du dossier `dist/` sur O2Switch

## Workflow de mise à jour

### Modifier le Backend

```bash
# 1. Faites vos modifications sur main
git checkout main
# ... modifications ...
git add backend/
git commit -m "Update backend"
git push origin main

# 2. Synchronisez avec la branche backend
git checkout backend
git merge main
git push origin backend
# ✅ Render redéploie automatiquement
```

### Modifier le Frontend

```bash
# Restez sur main
git checkout main
# ... modifications ...
git add src/
git commit -m "Update frontend"
git push origin main

# Build et déployez sur O2Switch
npm run build
# Uploadez dist/ sur O2Switch
```

## URLs de déploiement

### Backend (Render)
- URL de production : `https://votre-service.onrender.com`
- Health check : `https://votre-service.onrender.com/api/health`

### Frontend (O2Switch)
- URL de production : `https://votre-domaine.o2switch.com`

## Tests

### Tester le backend
```bash
curl https://votre-service.onrender.com/api/health
# Réponse attendue : {"status":"OK","message":"Server is running"}
```

### Tester le frontend
Ouvrez votre domaine O2Switch et vérifiez :
- L'application se charge correctement
- Les appels API fonctionnent (connexion, alertes, etc.)
- Pas d'erreurs CORS dans la console

## CORS Configuration

Le backend est configuré pour accepter les requêtes depuis `FRONTEND_URL` :

```javascript:server.js
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
```

Assurez-vous que `FRONTEND_URL` sur Render correspond **exactement** à votre domaine O2Switch.

## Troubleshooting

### Render : Service ne démarre pas
- Vérifiez les logs sur Render Dashboard
- Assurez-vous que MongoDB Atlas autorise les connexions
- Vérifiez que toutes les variables d'environnement sont définies

### Frontend : Erreurs CORS
- Vérifiez que `FRONTEND_URL` dans Render correspond à votre domaine
- Assurez-vous d'utiliser HTTPS (pas HTTP)
- Vérifiez la console du navigateur pour les détails

### Render : Service en veille (plan gratuit)
- Le plan gratuit de Render met le service en veille après 15 min d'inactivité
- Premier appel après veille : 30-60 secondes de délai
- Solution : Utilisez [UptimeRobot](https://uptimerobot.com) pour ping toutes les 5-10 min

## Avantages de cette architecture

✅ **Déploiements indépendants** : Backend et frontend se déploient séparément
✅ **Optimisation** : Render pour Node.js, O2Switch pour fichiers statiques
✅ **Coûts** : Plan gratuit Render + hébergement O2Switch existant
✅ **Performance** : Chaque service optimisé pour son usage
✅ **Évolutivité** : Facile d'ajouter d'autres services ou de migrer

## Scripts utiles

```bash
# Créer un admin sur Render (via SSH ou localement)
node scripts/create-admin.js

# Vérifier les branches
git branch -a

# Voir les différences entre branches
git diff main..backend

# Forcer la synchronisation backend
git checkout backend
git reset --hard main
# Puis restaurer les fichiers spécifiques à backend si nécessaire
```

## Documentation complémentaire

- Backend README : Voir `README.md` dans la branche `backend`
- Configuration Render : Voir `ENV-CONFIG-RENDER.md` dans la branche `backend`
- Workflow détaillé : Voir `WORKFLOW.md` dans la branche `backend`

---

**Date de création** : Octobre 2025  
**Dernière mise à jour** : Voir l'historique Git

