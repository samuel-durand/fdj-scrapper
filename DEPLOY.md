# 🚀 Guide de Déploiement sur Render

Ce guide vous explique comment déployer le backend de l'application Loterie FDJ sur Render.

## 📋 Prérequis

- ✅ Compte Render.com ([S'inscrire ici](https://render.com))
- ✅ Compte MongoDB Atlas ([S'inscrire ici](https://www.mongodb.com/cloud/atlas))
- ✅ Accès au repository GitHub

---

## 🗄️ Étape 1 : Configurer MongoDB Atlas

### 1.1 Créer un cluster

1. Connectez-vous à [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Cliquez sur "Build a Database"
3. Choisissez le plan **FREE (M0)**
4. Sélectionnez une région proche (ex: **AWS / Frankfurt**)
5. Nommez votre cluster (ex: `loterie-fdj`)

### 1.2 Créer un utilisateur de base de données

1. Dans "Database Access", cliquez "Add New Database User"
2. Choisissez "Password Authentication"
3. Générez un mot de passe fort
4. **⚠️ IMPORTANT : Sauvegardez ce mot de passe !**
5. Rôles : `Atlas admin` ou `Read and write to any database`

### 1.3 Configurer le réseau

1. Dans "Network Access", cliquez "Add IP Address"
2. Cliquez "Allow Access from Anywhere" (ajoute `0.0.0.0/0`)
3. Confirmez

### 1.4 Récupérer la connection string

1. Dans "Database", cliquez "Connect"
2. Choisissez "Connect your application"
3. Sélectionnez "Node.js" comme driver
4. Copiez la connection string :

```
mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
```

5. **Ajoutez le nom de la base de données** :
```
mongodb+srv://username:password@cluster.mongodb.net/loterie-fdj?retryWrites=true&w=majority
```

**⚠️ Remplacez `username` et `password` par vos vraies valeurs !**

---

## 🌐 Étape 2 : Déployer sur Render

### 2.1 Créer un nouveau service

1. Connectez-vous à [Render Dashboard](https://dashboard.render.com)
2. Cliquez "New +" → "Web Service"
3. Connectez votre repository GitHub
4. Sélectionnez le repository `fdj-scrapper`

### 2.2 Configurer le service

**Configuration de base** :
- **Name** : `loterie-fdj-backend`
- **Region** : Frankfurt (proche de l'Europe)
- **Branch** : `main`
- **Root Directory** : `backend`
- **Runtime** : Node
- **Build Command** : `npm install`
- **Start Command** : `npm start`
- **Plan** : Free

### 2.3 Ajouter les variables d'environnement

Dans la section "Environment Variables", ajoutez :

| Variable | Valeur |
|----------|--------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `MONGODB_URI` | `mongodb+srv://username:password@cluster.mongodb.net/loterie-fdj?retryWrites=true&w=majority` |
| `JWT_SECRET` | `Générez un secret de 32+ caractères` |
| `JWT_REFRESH_SECRET` | `Générez un autre secret de 32+ caractères` |
| `FRONTEND_URL` | `https://votre-domaine.com` |

**Comment générer les secrets JWT ?** Ouvrez un terminal Node.js :

```javascript
require('crypto').randomBytes(64).toString('hex')
```

Exécutez deux fois pour avoir deux secrets différents.

### 2.4 Déployer

1. Cliquez "Create Web Service"
2. Le déploiement démarre automatiquement
3. Attendez 2-3 minutes
4. Une fois déployé, vous obtiendrez l'URL : `https://loterie-fdj-backend.onrender.com`

---

## ✅ Étape 3 : Vérifier le déploiement

### 3.1 Health Check

Visitez : `https://loterie-fdj-backend.onrender.com/api/health`

Vous devriez voir :
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

### 3.2 Tester la connexion MongoDB

Dans les logs Render, vérifiez :
```
✅ Connected to MongoDB
🚀 Server running on port 10000
```

### 3.3 Créer un administrateur

Connectez-vous au service Render via SSH ou utilisez un script local :

```bash
# Modifiez temporairement BACKEND_URL dans .env local
cd backend
node scripts/create-admin.js "Admin" "admin@example.com" "password123"
```

---

## 🔄 Mise à jour automatique

Chaque fois que vous poussez sur GitHub :

```bash
git add .
git commit -m "Update backend"
git push origin main
```

Render redéploie automatiquement en 2-3 minutes ! ✨

---

## 🐛 Dépannage

### Problème : "MongoDB connection error"

**Solutions** :
- Vérifiez que l'IP `0.0.0.0/0` est autorisée dans MongoDB Atlas
- Vérifiez que `MONGODB_URI` est correct dans Render
- Vérifiez que le mot de passe MongoDB ne contient pas de caractères spéciaux non échappés

### Problème : "JWT_SECRET must have a value"

**Solution** :
- Vérifiez que `JWT_SECRET` et `JWT_REFRESH_SECRET` sont bien définis dans Render
- Vérifiez qu'ils font au moins 32 caractères

### Problème : Le service se redémarre constamment

**Solution** :
- Consultez les logs Render pour voir l'erreur exacte
- Vérifiez que toutes les variables d'environnement sont correctes
- Vérifiez que le PORT est bien configuré (Render fournit le PORT dynamiquement)

---

## 🔗 Prochaines étapes

Une fois le backend déployé :

1. **Configurer le frontend** : Mettez à jour `.env.production` avec l'URL Render
2. **Déployer le frontend** : Sur o2switch ou autre hébergement
3. **Tester l'application** : Ouvrez l'app et essayez de vous inscrire

---

**🎉 Félicitations ! Votre backend est maintenant en ligne !**

