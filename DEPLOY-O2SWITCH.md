# 🚀 Déploiement sur O2Switch - Application Complète

Cette configuration permet de déployer **frontend + backend** ensemble sur O2Switch avec une seule URL.

## 📦 Architecture

```
O2Switch
└── votre-domaine.com
    ├── /              → Frontend React (fichiers statiques)
    ├── /api/*         → Backend API Express
    └── MongoDB Atlas  → Base de données (cloud)
```

**Avantages** :
- ✅ Une seule URL pour tout
- ✅ Pas de problème CORS
- ✅ Déploiement simplifié
- ✅ Backend Node.js + Frontend React ensemble

## 🛠️ Préparation

### 1. Configuration .env

Créez un fichier `.env` dans le dossier `backend/` avec vos vraies valeurs :

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://fdj_db_user:VOTRE_MOT_DE_PASSE@fjd.c4zt5vn.mongodb.net/fdj?retryWrites=true&w=majority&appName=fjd
JWT_SECRET=votre_secret_jwt_32_caracteres_minimum
FRONTEND_URL=https://votre-domaine.o2switch.com
```

### 2. Build du frontend

```bash
npm run build
```

Cela créera le dossier `dist/` avec le frontend compilé.

### 3. Installation des dépendances backend

```bash
cd backend
npm install --production
```

## 📤 Déploiement sur O2Switch

### Fichiers à uploader

Uploadez ces fichiers/dossiers sur O2Switch (dans `public_html` ou votre dossier web) :

```
votre-site/
├── backend/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── node_modules/      (après npm install)
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env              (avec vos vraies valeurs)
├── dist/
│   ├── index.html
│   ├── resultats-cache.json
│   └── assets/
└── .htaccess             (voir ci-dessous)
```

### Fichier .htaccess (à la racine)

Créez un fichier `.htaccess` pour rediriger vers le serveur Node.js :

```apache
# Activer le proxy
RewriteEngine On

# Rediriger toutes les requêtes vers Node.js
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:5000/$1 [P,L]
```

**Note** : O2Switch supporte Node.js. Vérifiez le port disponible dans votre espace client.

## 🚀 Démarrage sur O2Switch

### Via SSH (recommandé)

1. Connectez-vous en SSH à O2Switch
2. Allez dans votre dossier :
   ```bash
   cd ~/public_html
   ```
3. Démarrez le serveur :
   ```bash
   cd backend
   node server.js
   ```

### Via cPanel (Node.js App)

1. Allez dans **cPanel** → **Setup Node.js App**
2. Créez une nouvelle application :
   - **Node.js version** : 18.x ou plus récent
   - **Application mode** : Production
   - **Application root** : `public_html`
   - **Application URL** : votre domaine
   - **Application startup file** : `backend/server.js`
3. Ajoutez les variables d'environnement dans l'interface
4. Cliquez sur **Start**

## 🔍 Vérification

### Test de l'API

```bash
curl https://votre-domaine.com/api/health
```

Réponse attendue :
```json
{"status":"OK","message":"Server is running"}
```

### Test du Frontend

Ouvrez `https://votre-domaine.com` dans votre navigateur.
Vous devriez voir votre application React.

## 🔧 Configuration MongoDB Atlas

N'oubliez pas dans MongoDB Atlas → **Network Access** :
- Ajoutez l'IP de votre serveur O2Switch
- Ou `0.0.0.0/0` pour autoriser toutes les IPs

## 📝 Scripts utiles

### Créer un compte admin

```bash
cd backend
node scripts/create-admin.js
```

### Redémarrer le serveur

Si vous utilisez PM2 (recommandé) :
```bash
pm2 restart loterie-backend
```

## 🔄 Mise à jour

Pour mettre à jour l'application :

1. **Frontend** :
   ```bash
   npm run build
   # Uploadez le nouveau dist/
   ```

2. **Backend** :
   ```bash
   # Modifiez les fichiers backend/
   # Uploadez les changements
   # Redémarrez le serveur
   ```

## ⚡ Optimisation avec PM2 (recommandé)

PM2 permet de garder le serveur toujours actif :

```bash
# Installer PM2
npm install -g pm2

# Démarrer l'application
cd backend
pm2 start server.js --name "loterie-backend"

# Sauvegarder la configuration
pm2 save

# Configurer le démarrage automatique
pm2 startup
```

## 🆘 Dépannage

### Le serveur ne démarre pas
- Vérifiez les logs : `pm2 logs`
- Vérifiez que le port 5000 est disponible
- Vérifiez le fichier `.env`

### Erreur MongoDB
- Vérifiez `MONGODB_URI` dans `.env`
- Vérifiez Network Access sur MongoDB Atlas

### Frontend ne se charge pas
- Vérifiez que `dist/` est bien uploadé
- Vérifiez que le serveur Node.js tourne
- Vérifiez `.htaccess`

## 📊 Structure finale sur O2Switch

```
public_html/
├── .htaccess                    # Proxy vers Node.js
├── backend/
│   ├── .env                     # Configuration (ne pas committer)
│   ├── server.js                # Serveur Express
│   ├── node_modules/            # Dépendances
│   └── ...                      # Autres fichiers backend
└── dist/                        # Frontend buildé
    ├── index.html
    └── assets/
```

---

✅ **Avantage** : Une seule URL, pas de CORS, déploiement simple !

