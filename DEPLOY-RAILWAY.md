# 🚂 Déploiement Backend sur Railway

Guide complet pour déployer uniquement le backend API sur Railway, en gardant le frontend sur votre hébergement actuel (o2switch).

## 📋 Prérequis

1. Un compte Railway : https://railway.app
2. Un compte MongoDB Atlas (ou autre instance MongoDB)
3. Un repository Git avec le backend
4. Le frontend déployé ailleurs avec l'URL connue

## 🚀 Étapes de déploiement

### 1. Préparer MongoDB

**Option A : MongoDB Atlas (Recommandé)**

1. Créez un compte sur https://www.mongodb.com/cloud/atlas
2. Créez un cluster (gratuit disponible)
3. Créez un utilisateur de base de données
4. Autorisez votre IP (ou `0.0.0.0/0` pour toutes les IPs)
5. Récupérez votre URI de connexion :
   ```
   mongodb+srv://username:password@cluster.mongodb.net/loterie-fdj?retryWrites=true&w=majority
   ```

**Option B : MongoDB hébergé ailleurs**

Utilisez l'URI de connexion de votre instance MongoDB.

### 2. Créer un nouveau projet sur Railway

1. **Connectez-vous à Railway** : https://railway.app
2. **Cliquez sur "New Project"**
3. **Sélectionnez "Deploy from GitHub repo"**
4. **Sélectionnez votre repository**
5. **Sélectionnez la branche `backend`**
   - **Root Directory** : Laisser vide (tout est à la racine sur cette branche)

### 3. Configurer les variables d'environnement

Dans Railway Dashboard, allez dans **"Variables"** et ajoutez :

#### Variables Obligatoires

| Variable | Description | Exemple |
|----------|-------------|---------|
| `MONGODB_URI` | URI de connexion MongoDB | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | Secret pour JWT (min 32 caractères) | `votre_secret_super_long_et_securise_ici` |
| `JWT_REFRESH_SECRET` | Secret pour refresh token | `autre_secret_different_et_securise` |

#### Variables Optionnelles mais Recommandées

| Variable | Description | Exemple |
|----------|-------------|---------|
| `FRONTEND_URL` | URL de votre frontend | `https://votre-domaine.com` ou plusieurs URLs séparées par des virgules |
| `PORT` | Port du serveur (auto par Railway) | `5000` (défini automatiquement) |
| `NODE_ENV` | Environnement | `production` (à définir dans Railway Dashboard) |
| `API_ONLY` | Mode API uniquement | `true` (défini automatiquement) |

**Exemple de configuration complète :**

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/loterie-fdj
JWT_SECRET=votre_secret_jwt_super_long_minimum_32_caracteres_secure
JWT_REFRESH_SECRET=votre_refresh_secret_different_et_aussi_long
FRONTEND_URL=https://votre-domaine.com
NODE_ENV=production
```

**Important :**
- `FRONTEND_URL` peut être une liste séparée par des virgules : `https://domaine1.com,https://domaine2.com`
- Les secrets JWT doivent être **très longs et sécurisés** (minimum 32 caractères)

### 4. Déploiement automatique

Railway va automatiquement :
1. **Installer les dépendances** : `npm ci`
2. **Démarrer le serveur** : `npm start`

Le backend n'a pas besoin de build, il démarre directement.

### 5. Récupérer l'URL de l'API

Une fois déployé, Railway génère automatiquement une URL :
- Exemple : `https://votre-backend.railway.app`

Votre API sera accessible sur :
- **Health check** : `https://votre-backend.railway.app/api/health`
- **Routes API** : `https://votre-backend.railway.app/api/*`

### 6. Configurer le frontend

Dans votre frontend (sur o2switch ou ailleurs), configurez :

**Option A : Variable d'environnement**

Créez/modifiez `.env.production` dans le frontend :
```env
VITE_API_URL=https://votre-backend.railway.app/api
```

Puis rebuild le frontend :
```bash
npm run build
```

**Option B : Sous-domaine (Recommandé)**

1. Dans Railway, configurez un domaine personnalisé
2. Exemple : `api.votre-domaine.com`
3. Configurez le DNS pour pointer vers Railway
4. Utilisez cette URL dans `VITE_API_URL`

## 📁 Structure du Backend pour Railway

```
(racine de la branche backend)
├── server.js           # Serveur Express (API uniquement en production)
├── package.json        # Scripts et dépendances
├── nixpacks.toml       # Configuration Railway
├── railway.json        # Configuration alternative
├── routes/             # Routes API
├── models/             # Modèles MongoDB
├── middleware/         # Middleware (auth, etc.)
├── scripts/            # Scripts utilitaires
└── .env                # Variables locales (NE PAS COMMITER)
```

**Note :** Sur la branche `backend`, tous les fichiers sont à la racine (pas de dossier `backend/`).

## 🔧 Configuration CORS

Le backend est configuré pour accepter les requêtes depuis :
- L'URL définie dans `FRONTEND_URL`
- Toutes les origines en production si `FRONTEND_URL` n'est pas défini (pour faciliter le développement)

Pour sécuriser en production, définissez toujours `FRONTEND_URL`.

## 🧪 Tester l'API

### Health Check
```bash
curl https://votre-backend.railway.app/api/health
```

Réponse attendue :
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

### Tester l'authentification
```bash
# Inscription
curl -X POST https://votre-backend.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🐛 Dépannage

### Erreur : "JWT_SECRET must be defined"
- **Solution** : Vérifiez que `JWT_SECRET` et `JWT_REFRESH_SECRET` sont définis dans Railway Variables
- Les secrets doivent faire minimum 32 caractères

### Erreur : "MongoDB connection error"
- **Solution** : Vérifiez que `MONGODB_URI` est correct
- Vérifiez que votre IP est autorisée dans MongoDB Atlas (ou utilisez `0.0.0.0/0`)
- Testez la connexion localement avec `npm run test-db`

### CORS errors dans le frontend
- **Solution** : Vérifiez que `FRONTEND_URL` est correctement défini dans Railway
- L'URL doit correspondre exactement à celle utilisée par le frontend (avec ou sans https)
- Vous pouvez définir plusieurs URLs séparées par des virgules

### Le backend ne démarre pas
- **Solution** : Vérifiez les logs dans Railway Dashboard
- Assurez-vous que toutes les variables obligatoires sont définies
- Vérifiez que `package.json` contient bien `"start": "node server.js"`

## 🔒 Sécurité

1. **Ne commitez JAMAIS** :
   - `.env` files
   - Secrets JWT
   - URI MongoDB avec mots de passe

2. **Utilisez des secrets forts** :
   - Minimum 32 caractères
   - Mélange de lettres, chiffres, symboles
   - Générer avec : `openssl rand -base64 32`

3. **Configurez CORS correctement** :
   - Définissez `FRONTEND_URL` pour limiter les origines autorisées

4. **MongoDB Atlas** :
   - Utilisez des IP whitelist spécifiques en production
   - Activez l'authentification
   - Utilisez des credentials forts

## 📝 Notes

- Le backend démarre directement, pas de build nécessaire
- Railway détecte automatiquement les changements sur la branche principale
- Chaque push déclenche un nouveau déploiement
- Les logs sont disponibles en temps réel dans Railway Dashboard

## 🔄 Mise à jour

Pour mettre à jour le backend :
1. Modifiez le code localement
2. Commit et push vers votre repository
3. Railway détecte les changements et redéploie automatiquement

## 📚 Documentation Complémentaire

- **`README.md`** : Documentation générale du backend
- **`../docs/DEPLOIEMENT-RAILWAYS.md`** : Guide déploiement frontend (si nécessaire)

---

✅ Votre backend API est maintenant prêt pour Railway !

