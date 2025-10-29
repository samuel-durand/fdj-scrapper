# Configuration Backend - Variables d'environnement

## Fichier .env à créer

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
# Environment
NODE_ENV=development

# Port (Render l'assigne automatiquement en production)
PORT=5000

# MongoDB Atlas Connection
# Remplacez les valeurs par vos informations MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/loterie-fdj?retryWrites=true&w=majority

# JWT Secret (minimum 32 caractères)
# Générez une clé sécurisée avec la commande ci-dessous
JWT_SECRET=votre_secret_jwt_tres_securise_minimum_32_caracteres_aleatoires

# Frontend URL (pour CORS)
FRONTEND_URL=http://localhost:5173
```

## Comment obtenir les informations

### 1. MongoDB Atlas URI

1. Allez sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créez un compte gratuit et un cluster (Free Tier - M0)
3. Cliquez sur **"Connect"** → **"Connect your application"**
4. Copiez la connection string :
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Remplacez :
   - `<username>` : Nom d'utilisateur de la base de données
   - `<password>` : Mot de passe de l'utilisateur
   - Ajoutez le nom de la base `/loterie-fdj` avant les paramètres
   
   Exemple final :
   ```
   mongodb+srv://monuser:monpass123@cluster0.abc123.mongodb.net/loterie-fdj?retryWrites=true&w=majority
   ```

### 2. JWT Secret

Générez une clé aléatoire sécurisée avec cette commande :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Cela générera quelque chose comme :
```
a7f4c3e2b9d8f6e1a5c4b3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2
```

Copiez cette valeur dans `JWT_SECRET`.

### 3. Frontend URL

**En développement local** :
```env
FRONTEND_URL=http://localhost:5173
```

**En production (sur Render)** :
```env
FRONTEND_URL=https://votre-domaine.o2switch.com
```

## Configuration MongoDB Atlas - Checklist

☐ **Database Access** :
   - Créez un utilisateur avec un nom et mot de passe
   - Donnez-lui les droits "Read and write to any database"

☐ **Network Access** :
   - Pour le développement local : Ajoutez votre IP actuelle
   - Pour Render (production) : Ajoutez `0.0.0.0/0` (autoriser toutes les IPs)

☐ **Database** :
   - Créez une base de données nommée `loterie-fdj`
   - Les collections seront créées automatiquement par l'application

## Test de connexion

Une fois le fichier `.env` créé, testez la connexion :

```bash
npm run dev
```

Vous devriez voir dans les logs :
```
✅ Connected to MongoDB
🚀 Server running on port 5000
📍 Frontend URL: http://localhost:5173
```

## Sur Render (Production)

Sur Render, n'utilisez PAS de fichier `.env`. Configurez les variables directement dans le Dashboard :

**Dashboard Render** → **Environment** → **Add Environment Variable**

Ajoutez les mêmes variables avec les valeurs de production :
- `NODE_ENV=production`
- `MONGODB_URI=...` (votre URI MongoDB Atlas)
- `JWT_SECRET=...` (votre clé générée)
- `FRONTEND_URL=https://votre-domaine.o2switch.com`

## Sécurité

⚠️ **IMPORTANT** :
- Ne commitez **JAMAIS** le fichier `.env` dans Git
- Le fichier `.gitignore` est configuré pour ignorer `.env`
- Utilisez des mots de passe forts pour MongoDB
- Générez toujours un nouveau JWT_SECRET pour la production
- Ne partagez jamais vos credentials MongoDB ou JWT Secret

## Dépannage

### "MongoServerError: bad auth"
➜ Vérifiez le nom d'utilisateur et mot de passe dans MONGODB_URI

### "MongooseServerSelectionError"
➜ Vérifiez Network Access sur MongoDB Atlas (autorisez votre IP ou 0.0.0.0/0)

### "CORS error"
➜ Vérifiez que FRONTEND_URL correspond exactement à l'URL de votre frontend

### "jwt malformed"
➜ Assurez-vous que JWT_SECRET est défini et a au moins 32 caractères

