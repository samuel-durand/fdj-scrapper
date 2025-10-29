# 🔐 Installation Backend JWT + MongoDB - Guide Complet

## ✅ Ce qui a été créé

Votre application dispose maintenant d'un **backend sécurisé professionnel** avec :
- ✅ **JWT** (JSON Web Tokens) pour l'authentification
- ✅ **Bcrypt** pour hasher les mots de passe (salt rounds: 12)
- ✅ **MongoDB** pour stocker les données
- ✅ **Express.js** pour l'API REST
- ✅ **Refresh tokens** pour sessions longues
- ✅ **CORS** configuré
- ✅ **Protection des routes**

---

## 📦 Structure des fichiers créés

```
backend/
├── server.js               # Serveur Express principal
├── package.json            # Dépendances backend
├── .env.example            # Template de configuration
├── .gitignore             # Fichiers à ignorer
├── README.md              # Documentation API
├── models/
│   ├── User.js            # Modèle utilisateur (avec bcrypt)
│   ├── Alert.js           # Modèle alertes
│   └── Notification.js    # Modèle notifications
├── routes/
│   ├── auth.js            # Routes authentification
│   ├── alerts.js          # Routes alertes
│   └── users.js           # Routes utilisateur
└── middleware/
    └── auth.js            # Middleware JWT

frontend/src/services/
├── api.js                 # Client API (avec auto-refresh)
├── authService.js         # Service authentification
└── alertServiceAPI.js     # Service alertes (API)
```

---

## 🚀 Installation en 5 étapes

### Étape 1 : Installer MongoDB

#### Option A : MongoDB Local (Windows)

1. **Télécharger MongoDB**
   - https://www.mongodb.com/try/download/community
   - Choisir "Windows x64"
   - Installer avec les options par défaut

2. **Vérifier l'installation**
```bash
mongod --version
```

#### Option B : MongoDB Atlas (Cloud - RECOMMANDÉ)

1. **Créer un compte gratuit**
   - https://www.mongodb.com/cloud/atlas/register
   
2. **Créer un cluster**
   - Cliquer "Build a Database"
   - Choisir "FREE" (M0)
   - Région : Belgium ou Paris
   - Cluster Name : "LoterieFDJ"
   
3. **Créer un utilisateur**
   - Username : `loterie-admin`
   - Password : Générer un mot de passe fort
   - **SAUVEGARDER CE MOT DE PASSE**

4. **Configurer IP Whitelist**
   - Add IP Address → "Allow Access from Anywhere" (0.0.0.0/0)
   
5. **Récupérer la connection string**
   - Cliquer "Connect"
   - "Connect your application"
   - Copier la connection string :
   ```
   mongodb+srv://loterie-admin:<password>@loteriefdjxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - Remplacer `<password>` par votre mot de passe

---

### Étape 2 : Installer les dépendances backend

```bash
cd backend
npm install
```

Cela installe :
- `express` - Serveur web
- `mongoose` - ODM MongoDB
- `bcryptjs` - Hashage mots de passe
- `jsonwebtoken` - JWT
- `cors` - CORS
- `dotenv` - Variables d'environnement
- `nodemon` - Auto-reload (dev)

---

### Étape 3 : Configurer les variables d'environnement

1. **Créer le fichier `.env`**
```bash
cd backend
copy .env.example .env
```

2. **Éditer `backend/.env`**

Pour **MongoDB Local** :
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

MONGODB_URI=mongodb://localhost:27017/loterie-fdj

JWT_SECRET=super_secret_changez_moi_minimum_32_caracteres_abc123
JWT_EXPIRE=7d

JWT_REFRESH_SECRET=refresh_secret_different_minimum_32_caracteres_xyz789
JWT_REFRESH_EXPIRE=30d
```

Pour **MongoDB Atlas** :
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

MONGODB_URI=mongodb+srv://loterie-admin:VOTRE_MOT_DE_PASSE@loteriefdjxxx.mongodb.net/loterie-fdj?retryWrites=true&w=majority

JWT_SECRET=super_secret_changez_moi_minimum_32_caracteres_abc123
JWT_EXPIRE=7d

JWT_REFRESH_SECRET=refresh_secret_different_minimum_32_caracteres_xyz789
JWT_REFRESH_EXPIRE=30d
```

**⚠️ IMPORTANT** : 
- Changez les `JWT_SECRET` par des valeurs aléatoires uniques
- **JAMAIS** commit le fichier `.env` sur Git

3. **Générer des secrets sécurisés** (optionnel mais recommandé)

Ouvrez Node.js et exécutez :
```javascript
require('crypto').randomBytes(64).toString('hex')
```

Utilisez le résultat pour `JWT_SECRET` et `JWT_REFRESH_SECRET`

---

### Étape 4 : Créer le fichier `.env` frontend

Créez `frontend/.env` (ou `.env` à la racine) :
```env
VITE_API_URL=http://localhost:5000/api
```

---

### Étape 5 : Lancer le backend

```bash
cd backend
npm run dev
```

Vous devriez voir :
```
✅ Connected to MongoDB
🚀 Server running on port 5000
📍 Frontend URL: http://localhost:5173
```

---

## ✅ Vérification de l'installation

### Test 1 : Health check
```bash
curl http://localhost:5000/api/health
```

Réponse attendue :
```json
{"status":"OK","message":"Server is running"}
```

### Test 2 : Créer un compte

Ouvrez l'application frontend :
```bash
cd ..
npm run dev
```

1. Cliquez sur "Inscription"
2. Remplissez le formulaire
3. Validez

Si ça fonctionne : ✅ **TOUT EST BON !**

---

## 🎯 Utilisation complète

### Frontend + Backend ensemble

**Terminal 1 - Backend** :
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend** :
```bash
npm run dev
```

L'application est maintenant **100% sécurisée** avec :
- ✅ Mots de passe hashés avec bcrypt
- ✅ Authentification par JWT
- ✅ Sessions persistantes
- ✅ Refresh tokens automatiques
- ✅ Protection des routes

---

## 🔧 Dépannage

### Problème 1 : "MongoDB connection error"

**Solution pour MongoDB Local** :
```bash
# Démarrer MongoDB
net start MongoDB
```

**Solution pour MongoDB Atlas** :
- Vérifiez la connection string dans `.env`
- Vérifiez que le mot de passe est correct
- Vérifiez que l'IP est autorisée (0.0.0.0/0)

### Problème 2 : "CORS Error"

Vérifiez que :
- `FRONTEND_URL` dans `backend/.env` = `http://localhost:5173`
- Le backend est lancé AVANT le frontend

### Problème 3 : "Cannot find module"

```bash
cd backend
npm install
```

### Problème 4 : "JWT Error"

Vérifiez que `JWT_SECRET` est défini dans `backend/.env`

### Problème 5 : Frontend ne se connecte pas au backend

1. Vérifiez `VITE_API_URL` dans `.env` frontend
2. Redémarrez le frontend :
```bash
npm run dev
```

---

## 📊 Tester avec des données

### Créer un utilisateur de test

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User\",\"email\":\"test@test.com\",\"password\":\"test123\"}"
```

### Se connecter

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@test.com\",\"password\":\"test123\"}"
```

Récupérez le `token` dans la réponse et utilisez-le :

```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI"
```

---

## 🔐 Sécurité - Ce qui est protégé

### Mots de passe
- ✅ Hashés avec **bcrypt** (12 salt rounds)
- ✅ JAMAIS stockés en clair
- ✅ Validation de la force (min 6 caractères)

### JWT
- ✅ Tokens signés et vérifiés
- ✅ Expiration automatique (7 jours)
- ✅ Refresh tokens (30 jours)
- ✅ Secrets différents pour access/refresh

### API
- ✅ Routes protégées par middleware
- ✅ Vérification de l'owner des ressources
- ✅ CORS configuré
- ✅ Validation des données

---

## 🚀 Déploiement (Optionnel)

### Backend sur Render.com (Gratuit)

1. **Créer un compte** : https://render.com
2. **New → Web Service**
3. **Connecter votre repo GitHub**
4. **Configuration** :
   - Build Command : `cd backend && npm install`
   - Start Command : `cd backend && npm start`
5. **Environment Variables** :
   - `MONGODB_URI` : Votre connection string
   - `JWT_SECRET` : Votre secret
   - `JWT_REFRESH_SECRET` : Votre refresh secret
   - `FRONTEND_URL` : URL de votre frontend déployé
   - `NODE_ENV` : `production`
6. **Deploy !**

### Frontend (déjà sur o2switch)

Mettez à jour `.env` avec l'URL du backend déployé :
```env
VITE_API_URL=https://votre-backend.onrender.com/api
```

Rebuild et uploadez :
```bash
npm run build
# Upload dist/ vers o2switch
```

---

## 📚 Documentation

- **API Backend** : `backend/README.md`
- **Alertes** : `docs/SYSTEME_ALERTES.md`
- **Espace utilisateur** : `docs/ESPACE_UTILISATEUR.md`

---

## ✅ Checklist finale

- [ ] MongoDB installé et démarré
- [ ] Backend `npm install` effectué
- [ ] Fichier `backend/.env` configuré
- [ ] Backend lancé avec `npm run dev`
- [ ] Frontend `.env` configuré avec `VITE_API_URL`
- [ ] Frontend lancé avec `npm run dev`
- [ ] Inscription testée et fonctionnelle
- [ ] Connexion testée et fonctionnelle
- [ ] Alertes fonctionnent avec le backend

---

## 🎉 Félicitations !

Vous avez maintenant une application **professionnelle et sécurisée** avec :
- 🔐 Authentification JWT complète
- 🔒 Mots de passe hashés avec bcrypt
- 💾 Base de données MongoDB
- 🔔 Système d'alertes complet
- 📱 Interface moderne et responsive

**L'application est prête pour la production !** 🚀

---

*Si vous rencontrez des problèmes, consultez la documentation ou ouvrez une issue sur GitHub.*

