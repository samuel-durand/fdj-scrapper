# 🔐 Backend API - Loterie FDJ

Backend sécurisé avec **JWT** et **Bcrypt** pour l'application de résultats FDJ.

---

## 🚀 Installation

### 1. Installer MongoDB

#### Option A : MongoDB Local
```bash
# Windows : Télécharger depuis https://www.mongodb.com/try/download/community
# Mac : brew install mongodb-community
# Linux : sudo apt-get install mongodb
```

#### Option B : MongoDB Atlas (Cloud - Recommandé)
1. Créez un compte sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créez un cluster gratuit
3. Récupérez votre connection string

### 2. Installer les dépendances
```bash
cd backend
npm install
```

### 3. Configuration
```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env avec vos valeurs
```

**Important** : Changez les secrets JWT en production !

---

## ⚙️ Configuration (.env)

```env
# Server
PORT=5000
NODE_ENV=development

# Frontend (CORS)
FRONTEND_URL=http://localhost:5173

# MongoDB
MONGODB_URI=mongodb://localhost:27017/loterie-fdj
# ou Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/loterie-fdj

# JWT Secrets (CHANGEZ EN PRODUCTION!)
JWT_SECRET=votre_secret_ici_minimum_32_caracteres
JWT_EXPIRE=7d

JWT_REFRESH_SECRET=votre_refresh_secret_different
JWT_REFRESH_EXPIRE=30d
```

---

## 🏃 Lancement

### Mode développement (avec auto-reload)
```bash
npm run dev
```

### Mode production
```bash
npm start
```

Le serveur démarre sur `http://localhost:5000`

### Créer un compte administrateur

#### Mode interactif (recommandé si le terminal supporte readline)
```bash
npm run create-admin
```

Le script vous demandera :
- Nom de l'administrateur
- Email
- Mot de passe (min. 6 caractères)

#### Mode non-interactif (si le mode interactif ne fonctionne pas)
```bash
node scripts/create-admin.js "Nom Admin" "admin@example.com" "motdepasse123"
```

**Note** : Le mode non-interactif est automatiquement détecté lorsque vous passez 3 arguments.

### Générer des alertes pour toutes les combinaisons
```bash
npm run generate-alerts
```

Ce script :
- ✅ Vérifie toutes les combinaisons des utilisateurs
- ✅ Compare avec les tirages du jour
- ✅ Crée des alertes et notifications automatiquement
- ✅ Met à jour les résultats des combinaisons gagnantes
- ✅ Affiche un résumé des gains

**Note** : Le script utilise des tirages simulés par défaut. Vous pouvez les modifier dans le script pour utiliser de vrais tirages.

---

## 📚 API Endpoints

### 🔐 Authentification

#### POST `/api/auth/register`
Créer un nouveau compte

**Body:**
```json
{
  "name": "Jean Dupont",
  "email": "jean@example.com",
  "password": "motdepasse123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Inscription réussie",
  "data": {
    "user": { ... },
    "token": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

#### POST `/api/auth/login`
Se connecter

**Body:**
```json
{
  "email": "jean@example.com",
  "password": "motdepasse123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": { ... },
    "token": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

#### POST `/api/auth/refresh`
Rafraîchir le token d'accès

**Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

#### POST `/api/auth/logout` 🔒
Se déconnecter

**Headers:**
```
Authorization: Bearer {token}
```

#### GET `/api/auth/me` 🔒
Récupérer le profil utilisateur

---

### 👤 Utilisateur

#### PUT `/api/users/preferences` 🔒
Mettre à jour les préférences

**Body:**
```json
{
  "favoriteGames": ["euromillions", "loto"],
  "defaultTab": "euromillions",
  "notifications": true,
  "theme": "dark"
}
```

#### PUT `/api/users/profile` 🔒
Mettre à jour le profil

**Body:**
```json
{
  "name": "Jean Nouveau Nom",
  "email": "nouveau@email.com"
}
```

#### PUT `/api/users/password` 🔒
Changer le mot de passe

**Body:**
```json
{
  "currentPassword": "ancien",
  "newPassword": "nouveau123"
}
```

---

### 🔔 Alertes

#### GET `/api/alerts` 🔒
Récupérer toutes les alertes

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [ ... ]
}
```

#### POST `/api/alerts` 🔒
Créer une nouvelle alerte

**Body:**
```json
{
  "name": "Gros jackpot",
  "type": "jackpot_threshold",
  "game": "euromillions",
  "config": {
    "threshold": 100000000
  }
}
```

#### PUT `/api/alerts/:id` 🔒
Mettre à jour une alerte

#### DELETE `/api/alerts/:id` 🔒
Supprimer une alerte

#### PATCH `/api/alerts/:id/toggle` 🔒
Activer/désactiver une alerte

---

## 🔒 Authentification

Toutes les routes marquées 🔒 nécessitent un token JWT dans le header :

```
Authorization: Bearer {votre_token_jwt}
```

### Cycle de vie des tokens

1. **Login/Register** → Reçoit `token` + `refreshToken`
2. **Requêtes** → Utilise le `token` (expire en 7 jours)
3. **Token expiré** → Utilise `refreshToken` pour obtenir un nouveau `token`
4. **RefreshToken expiré** → Redemande login

---

## 🔐 Sécurité

### Hashage des mots de passe
- Algorithme : **bcrypt**
- Salt rounds : **12**
- Mots de passe **JAMAIS** stockés en clair

### JWT
- **Access Token** : 7 jours (configurable)
- **Refresh Token** : 30 jours (configurable)
- Secrets différents pour access et refresh
- Tokens signés et vérifiés

### Protection CORS
- Seules les origines autorisées peuvent accéder à l'API
- Configurable via `FRONTEND_URL`

---

## 📊 Modèles de données

### User
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, lowercase),
  password: String (hashed),
  preferences: {
    favoriteGames: [String],
    defaultTab: String,
    notifications: Boolean,
    theme: String
  },
  refreshToken: String,
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Alert
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  name: String,
  type: String (enum),
  game: String (enum),
  enabled: Boolean,
  config: {
    threshold: Number,
    numbers: [Number],
    minMatches: Number,
    luckyNumber: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Notification
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  alertId: ObjectId (ref: Alert),
  alertName: String,
  message: String,
  gameType: String,
  draw: Object,
  read: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🧪 Test de l'API

### Avec cURL
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Get profile (remplacez TOKEN)
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

### Avec Postman
1. Importer la collection (à venir)
2. Tester les endpoints
3. Les tokens sont gérés automatiquement

---

## 🐛 Débogage

### Vérifier MongoDB
```bash
# Local
mongosh
> show dbs
> use loterie-fdj
> show collections
> db.users.find()
```

### Logs serveur
Les logs sont affichés dans la console en mode développement.

### Erreurs communes

#### "MongoDB connection error"
- Vérifiez que MongoDB est démarré
- Vérifiez `MONGODB_URI` dans `.env`

#### "JWT Error"
- Vérifiez que `JWT_SECRET` est défini
- Vérifiez que le token n'est pas expiré

#### "CORS Error"
- Vérifiez `FRONTEND_URL` dans `.env`
- Assurez-vous que l'origine correspond

---

## 📦 Déploiement

### Heroku
```bash
heroku create nom-app
heroku config:set JWT_SECRET=...
heroku config:set MONGODB_URI=...
git push heroku main
```

### Render / Railway
1. Connectez votre repo GitHub
2. Ajoutez les variables d'environnement
3. Déployez

### VPS (Linux)
```bash
# Installer Node.js et MongoDB
# Cloner le repo
# npm install
# pm2 start server.js
# nginx reverse proxy
```

---

## 🔮 Prochaines fonctionnalités

- [ ] Rate limiting
- [ ] Email verification
- [ ] Password reset
- [ ] 2FA (Two-Factor Authentication)
- [ ] Social login (Google, Facebook)
- [ ] Admin dashboard
- [ ] Logs avancés
- [ ] Tests unitaires
- [ ] CI/CD

---

## 📞 Support

- Documentation : `/docs`
- Issues : GitHub Issues
- Questions : GitHub Discussions

---

**Backend créé avec ❤️ pour la sécurité et les performances**

