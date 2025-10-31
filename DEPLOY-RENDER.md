# 🚀 Déploiement Rapide sur Render

Guide rapide pour déployer le backend sur Render en 5 minutes !

---

## ⚡ Déploiement en 5 étapes

### 1️⃣ MongoDB Atlas

1. Créez un cluster gratuit : https://www.mongodb.com/cloud/atlas
2. Ajoutez un utilisateur avec mot de passe
3. Autorisez l'IP `0.0.0.0/0`
4. Copiez la connection string

### 2️⃣ Render Dashboard

1. Allez sur https://dashboard.render.com
2. Cliquez "New +" → "Web Service"
3. Connectez votre repo GitHub `samuel-durand/fdj-scrapper`

### 3️⃣ Configuration Render

Render détecte automatiquement `render.yaml` ! Mais configurez manuellement :

- **Name** : `loterie-fdj-backend`
- **Root Directory** : `backend`
- **Build Command** : `npm install` (automatique)
- **Start Command** : `npm start` (automatique)
- **Plan** : Free

### 4️⃣ Variables d'environnement

Dans "Environment" → Ajoutez :

```
MONGODB_URI = mongodb+srv://user:pass@cluster.mongodb.net/loterie-fdj?retryWrites=true&w=majority
JWT_SECRET = (générez un secret de 64 caractères)
JWT_REFRESH_SECRET = (générez un autre secret de 64 caractères)
NODE_ENV = production
PORT = 10000
FRONTEND_URL = https://votre-domaine.com
```

**Générer les secrets** :
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Exécutez deux fois pour deux secrets différents.

### 5️⃣ Créer un admin

Attendez le déploiement (2-3 min), puis :

```bash
# Modifiez votre .env local temporairement avec l'URL Render
cd backend
node scripts/create-admin.js "Admin" "admin@example.com" "password123"
```

---

## ✅ Vérification

Visitez : `https://loterie-fdj-backend.onrender.com/api/health`

Réponse attendue :
```json
{"status":"OK","message":"Server is running"}
```

---

## 🔄 Mise à jour automatique

Chaque push sur GitHub → Render redéploie automatiquement !

```bash
git push origin main
```

Attendez 2-3 minutes, c'est tout ! 🎉

---

## 🐛 Problèmes ?

- **"MongoDB connection error"** : Vérifiez `MONGODB_URI` et `0.0.0.0/0`
- **"JWT_SECRET must have a value"** : Vérifiez les secrets dans Render
- **Service qui redémarre** : Consultez les logs Render

---

**🎉 C'est tout ! Votre backend est en ligne !**

