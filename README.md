# Backend API - Loterie FDJ

Backend Node.js/Express pour l'application Loterie FDJ avec système d'authentification, alertes et gestion des combinaisons.

## 🚀 Déploiement sur Render

Cette branche est spécifiquement conçue pour le déploiement du backend sur Render.

### Configuration sur Render

Un fichier `render.yaml` est inclus dans ce repository. Render le détectera automatiquement lors du déploiement.

**Configuration manuelle** (si render.yaml n'est pas détecté) :
1. **Build Command** : `npm install`
2. **Start Command** : `node server.js`
3. **Environment** : Node

⚠️ **Important** : NE PAS utiliser `npm run build` comme Build Command. Le backend n'a pas besoin de build.

### Variables d'environnement requises

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` (ou laissez Render l'assigner automatiquement) |
| `MONGODB_URI` | URI de connexion MongoDB Atlas |
| `JWT_SECRET` | Clé secrète pour JWT (minimum 32 caractères) |
| `FRONTEND_URL` | URL du frontend sur O2Switch |

Voir `ENV-CONFIG-RENDER.md` pour plus de détails.

## 📦 Installation locale

```bash
npm install
```

## 🔧 Configuration

Créez un fichier `.env` à la racine :

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/loterie-fdj
JWT_SECRET=votre_secret_jwt_securise
FRONTEND_URL=http://localhost:5173
```

## 🚀 Démarrage

```bash
# Mode développement
npm run dev

# Mode production
npm start
```

## 📁 Structure

```
├── middleware/       # Middlewares (authentification, etc.)
├── models/          # Modèles MongoDB (User, Alert, Combination, etc.)
├── routes/          # Routes API
├── scripts/         # Scripts utilitaires (création admin, etc.)
└── server.js        # Point d'entrée de l'application
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
- `GET /api/combinations` - Liste des combinaisons
- `POST /api/combinations` - Sauvegarder une combinaison
- `PUT /api/combinations/:id` - Modifier une combinaison
- `DELETE /api/combinations/:id` - Supprimer une combinaison

### Administration
- `GET /api/admin/users` - Liste des utilisateurs (admin)
- `PUT /api/admin/users/:id` - Modifier un utilisateur (admin)
- `DELETE /api/admin/users/:id` - Supprimer un utilisateur (admin)

### Health Check
- `GET /api/health` - Vérification du statut du serveur

## 👤 Création d'un compte administrateur

```bash
node scripts/create-admin.js
```

## 🔄 Workflow de mise à jour

Pour mettre à jour le backend déployé sur Render :

```bash
# Depuis la branche main (après vos modifications)
git checkout backend
git merge main
git push origin backend
```

Render redéploiera automatiquement le backend.

## 📊 MongoDB

Le backend utilise MongoDB pour stocker :
- Utilisateurs (avec authentification JWT)
- Alertes personnalisées
- Combinaisons sauvegardées
- Notifications

Utilisez MongoDB Atlas (gratuit) pour la production sur Render.

## 🛡️ Sécurité

- Authentification JWT
- Hachage des mots de passe avec bcrypt
- CORS configuré pour le frontend
- Variables d'environnement pour les secrets

## 📝 Licence

MIT

