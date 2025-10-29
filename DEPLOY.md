# 🚀 Guide de Déploiement Rapide

## Déploiement sur Render

### Étape 1 : Créer le service

1. Allez sur [render.com](https://render.com)
2. Créez un **Web Service**
3. Connectez votre repository GitHub : `samuel-durand/fdj-scrapper`
4. **Sélectionnez la branche `backend`** ⚠️ Important !

### Étape 2 : Configuration automatique

Render détecte automatiquement le fichier `render.yaml` qui configure :
- Build Command : `npm install`
- Start Command : `node server.js`

Vous n'avez **rien à configurer manuellement** !

### Étape 3 : Variables d'environnement

Dans **Dashboard Render** → **Environment**, ajoutez :

```
NODE_ENV = production
MONGODB_URI = mongodb+srv://user:password@cluster.mongodb.net/loterie-fdj
JWT_SECRET = (générer avec la commande ci-dessous)
FRONTEND_URL = https://votre-domaine.o2switch.com
```

**Générer JWT_SECRET** :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Étape 4 : MongoDB Atlas

1. Créez un compte gratuit sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créez un cluster **M0 Free**
3. **Database Access** : Créez un utilisateur avec mot de passe
4. **Network Access** : Ajoutez `0.0.0.0/0` (autoriser toutes les IPs pour Render)
5. Cliquez sur **Connect** → **Connect your application** → Copiez l'URI
6. Remplacez `<password>` par votre mot de passe et ajoutez `/loterie-fdj`

### Étape 5 : Déployer

Cliquez sur **"Create Web Service"** sur Render. Le déploiement commence automatiquement !

### Étape 6 : Tester

Une fois déployé, testez votre API :

```bash
curl https://votre-service.onrender.com/api/health
```

Réponse attendue :
```json
{"status":"OK","message":"Server is running"}
```

## Frontend sur O2Switch

Configurez l'URL de l'API dans votre frontend :

**.env.production** (ou configuration Vite) :
```env
VITE_API_URL=https://votre-service.onrender.com/api
```

Puis buildez et uploadez sur O2Switch :
```bash
npm run build
# Uploadez le dossier dist/ sur O2Switch
```

## Mise à jour du backend

Pour déployer une nouvelle version :

```bash
git checkout backend
git merge main  # Ou faites vos modifications directement
git push origin backend
```

Render redéploie automatiquement ! ✨

## Vérification CORS

Si le frontend ne peut pas contacter le backend :
1. Vérifiez que `FRONTEND_URL` sur Render = votre domaine O2Switch exact
2. Vérifiez la console du navigateur pour les erreurs CORS
3. Assurez-vous d'utiliser HTTPS (pas HTTP)

## Créer un compte admin

Une fois déployé, connectez-vous en SSH sur Render ou localement :

```bash
node scripts/create-admin.js
```

---

✅ **C'est tout !** Votre backend est déployé et prêt à recevoir des requêtes.

