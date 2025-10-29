# Backend API - Loterie FDJ

Backend Node.js/Express pour l'application Loterie FDJ avec système d'authentification JWT, alertes et gestion des combinaisons.

## 🚀 Déploiement sur Render

Cette branche contient **uniquement le backend** pour un déploiement facile sur Render.

### Configuration automatique

Le fichier `render.yaml` configure automatiquement :
- **Build Command** : `npm install`
- **Start Command** : `node server.js`
- **Runtime** : Node

### Variables d'environnement sur Render

Configurez ces variables dans **Dashboard Render** → **Environment** :

| Variable | Exemple | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Mode production |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/loterie-fdj` | URI MongoDB Atlas |
| `JWT_SECRET` | `(générer une clé)` | Secret JWT (32+ caractères) |
| `FRONTEND_URL` | `https://votre-domaine.o2switch.com` | URL frontend pour CORS |

**Générer un JWT Secret** :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### MongoDB Atlas

1. Créez un cluster gratuit sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créez un utilisateur de base de données
3. Network Access : Ajoutez `0.0.0.0/0` (autoriser Render)
4. Copiez l'URI de connexion

## 📦 Développement local

### Installation

```bash
npm install
```

### Configuration

Copiez le fichier exemple et remplissez vos valeurs :

```bash
cp env.example .env
```

Puis éditez `.env` avec vos vraies valeurs :

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/loterie-fdj
JWT_SECRET=votre_secret_jwt_32_caracteres_minimum
FRONTEND_URL=http://localhost:5173
```

**Générer JWT_SECRET** :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Démarrage

```bash
# Mode développement
npm run dev

# Mode production
npm start
```

## 📁 Structure

```
├── middleware/       # Middlewares (authentification)
├── models/          # Modèles MongoDB (User, Alert, Combination, Notification)
├── routes/          # Routes API (auth, alerts, combinations, users, admin)
├── scripts/         # Scripts utilitaires (create-admin.js)
├── server.js        # Point d'entrée de l'application
├── package.json     # Dépendances backend
└── render.yaml      # Configuration Render
```

## 🔐 Routes API

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil utilisateur

### Alertes
- `GET /api/alerts` - Liste des alertes
- `POST /api/alerts` - Créer une alerte
- `PUT /api/alerts/:id` - Modifier une alerte
- `DELETE /api/alerts/:id` - Supprimer une alerte

### Combinaisons
- `GET /api/combinations` - Liste des combinaisons sauvegardées
- `POST /api/combinations` - Sauvegarder une combinaison
- `PUT /api/combinations/:id` - Modifier une combinaison
- `DELETE /api/combinations/:id` - Supprimer une combinaison

### Administration
- `GET /api/admin/users` - Liste des utilisateurs (admin)
- `PUT /api/admin/users/:id` - Modifier un utilisateur (admin)
- `DELETE /api/admin/users/:id` - Supprimer un utilisateur (admin)

### Health Check
- `GET /api/health` - Vérification du statut du serveur

## 👤 Créer un compte administrateur

```bash
node scripts/create-admin.js
```

## 🔄 Workflow de mise à jour

Pour mettre à jour le backend sur Render :

```bash
# 1. Faites vos modifications sur la branche main
git checkout main
# ... vos modifications du code backend ...
git add backend/
git commit -m "Update backend"
git push origin main

# 2. Synchronisez avec la branche backend
git checkout backend
git merge main
git push origin backend
```

Render redéploie automatiquement après le push.

## 🛡️ Sécurité

- ✅ Authentification JWT
- ✅ Hachage des mots de passe avec bcrypt
- ✅ CORS configuré pour le frontend
- ✅ Variables d'environnement pour les secrets (jamais dans le code)

## 📝 Notes

- Le fichier `.env` n'est **jamais committé** (dans `.gitignore`)
- En production, utilisez les variables d'environnement de Render
- Render (plan gratuit) met le service en veille après 15 min d'inactivité
- Premier appel après veille : ~30-60 secondes

## 📄 Licence

MIT
