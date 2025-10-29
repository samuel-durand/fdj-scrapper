# Guide Rapide - Configuration MongoDB Atlas

## 🚀 Création d'un compte MongoDB Atlas (Gratuit)

### Étape 1 : Créer un compte
1. Allez sur https://www.mongodb.com/cloud/atlas
2. Cliquez sur **"Try Free"**
3. Inscrivez-vous avec Google, GitHub ou email

### Étape 2 : Créer un cluster gratuit
1. Choisissez **"M0 Free"** (cluster gratuit)
2. Sélectionnez le cloud provider : **AWS** (recommandé)
3. Région : Choisissez la plus proche (ex: Frankfurt eu-central-1)
4. Cluster Name : Laissez par défaut ou nommez-le `loterie-backend`
5. Cliquez sur **"Create Cluster"** (création ~3-5 minutes)

### Étape 3 : Configurer l'accès à la base de données

#### 3.1 Créer un utilisateur

1. Dans le menu de gauche, cliquez sur **"Database Access"**
2. Cliquez sur **"Add New Database User"**
3. Remplissez :
   - **Username** : `loterie-admin` (ou ce que vous voulez)
   - **Password** : Générez un mot de passe fort ou créez-en un
   - ⚠️ **Notez ce mot de passe quelque part !**
4. **Database User Privileges** : Sélectionnez `Read and write to any database`
5. Cliquez sur **"Add User"**

#### 3.2 Autoriser les connexions

1. Dans le menu de gauche, cliquez sur **"Network Access"**
2. Cliquez sur **"Add IP Address"**

**Pour le développement local** :
   - Cliquez sur **"Add Current IP Address"**
   - Cliquez sur **"Confirm"**

**Pour Render (production)** :
   - Cliquez sur **"Add IP Address"**
   - Entrez : `0.0.0.0/0` (autorise toutes les IPs)
   - Description : `Render Production`
   - Cliquez sur **"Confirm"**

⚠️ Note : `0.0.0.0/0` autorise toutes les connexions. C'est nécessaire pour Render car l'IP peut changer. La sécurité est assurée par le username/password.

### Étape 4 : Obtenir l'URI de connexion

1. Retournez sur **"Database"** (menu de gauche)
2. Cliquez sur **"Connect"** sur votre cluster
3. Sélectionnez **"Connect your application"**
4. Driver : **Node.js**, Version : **5.5 or later**
5. Copiez la connection string :

```
mongodb+srv://loterie-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### Étape 5 : Créer le fichier .env

1. À la racine du projet backend, copiez le fichier template :
   ```bash
   cp env.example .env
   ```

2. Éditez le fichier `.env` et remplissez `MONGODB_URI` :

**Remplacez** :
- `<password>` par le mot de passe que vous avez créé à l'étape 3.1
- Ajoutez `/loterie-fdj` après `.net` pour spécifier le nom de la base de données

**Exemple final** :
```env
MONGODB_URI=mongodb+srv://loterie-admin:MonMotDePasse123@cluster0.abc123.mongodb.net/loterie-fdj?retryWrites=true&w=majority
```

### Étape 6 : Générer le JWT Secret

Dans votre terminal, exécutez :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copiez le résultat (une longue chaîne de caractères) et ajoutez-le dans `.env` :

```env
JWT_SECRET=a7f4c3e2b9d8f6e1a5c4b3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2
```

### Étape 7 : Votre fichier .env final

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://loterie-admin:MonMotDePasse123@cluster0.abc123.mongodb.net/loterie-fdj?retryWrites=true&w=majority
JWT_SECRET=a7f4c3e2b9d8f6e1a5c4b3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2
FRONTEND_URL=http://localhost:5173
```

### Étape 8 : Tester la connexion

```bash
npm run dev
```

Vous devriez voir :
```
✅ Connected to MongoDB
🚀 Server running on port 5000
📍 Frontend URL: http://localhost:5173
```

## 🎯 Configuration sur Render (Production)

Ne créez PAS de fichier `.env` sur Render. Utilisez les variables d'environnement :

1. Dashboard Render → Votre service → **Environment**
2. Cliquez sur **"Add Environment Variable"**
3. Ajoutez :

```
NODE_ENV = production
MONGODB_URI = mongodb+srv://loterie-admin:MonMotDePasse123@cluster0.abc123.mongodb.net/loterie-fdj?retryWrites=true&w=majority
JWT_SECRET = (votre clé générée)
FRONTEND_URL = https://votre-domaine.o2switch.com
```

4. **Save Changes** et redéployez

## 🔍 Vérification dans MongoDB Atlas

Pour voir vos données :

1. Allez sur **"Database"** dans MongoDB Atlas
2. Cliquez sur **"Browse Collections"** sur votre cluster
3. Vous verrez la base `loterie-fdj` avec les collections :
   - `users` - Utilisateurs de l'application
   - `alerts` - Alertes configurées
   - `combinations` - Combinaisons sauvegardées
   - `notifications` - Notifications envoyées

## ❌ Problèmes courants

### "MongoServerError: bad auth"
➜ Mot de passe incorrect dans MONGODB_URI
➜ Vérifiez que vous avez bien remplacé `<password>` par votre vrai mot de passe
➜ Attention aux caractères spéciaux (encodez-les en URL)

### "MongooseServerSelectionError: connection refused"
➜ IP non autorisée dans Network Access
➜ Ajoutez votre IP ou `0.0.0.0/0`

### "ENOTFOUND cluster0.xxxxx.mongodb.net"
➜ URI de connexion incorrect
➜ Vérifiez que vous avez copié la bonne connection string depuis Atlas

### Le cluster ne répond pas
➜ Le cluster gratuit peut être en pause après 60 jours d'inactivité
➜ Connectez-vous à MongoDB Atlas pour le réactiver

## 💡 Astuces

- **Développement** : Utilisez un cluster de test différent du cluster de production
- **Sécurité** : Ne committez JAMAIS le fichier `.env` dans Git
- **Backup** : MongoDB Atlas fait des backups automatiques (plan gratuit = 2 jours de rétention)
- **Monitoring** : Consultez les métriques dans l'onglet "Metrics" de votre cluster

## 📚 Ressources

- Documentation MongoDB : https://docs.mongodb.com/
- MongoDB Atlas : https://www.mongodb.com/docs/atlas/
- Mongoose (ODM) : https://mongoosejs.com/

---

✅ **Une fois configuré, vous n'avez plus besoin de toucher à MongoDB Atlas !**

