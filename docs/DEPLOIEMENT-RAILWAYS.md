# 🚂 Déploiement du Frontend sur Railways

Guide complet pour déployer le frontend de l'application loterie sur Railway.

## 📋 Prérequis

1. Un compte Railway : https://railway.app
2. Un repository Git (GitHub, GitLab, etc.)
3. Le projet doit être commit et push sur le repository

## 🚀 Étapes de déploiement

### 1. Préparer le build localement (optionnel)

Avant de déployer, vous pouvez tester le build localement :

```bash
# Installer les dépendances
npm install

# Créer le build
npm run build

# Tester le serveur local
npm start
```

Le serveur devrait démarrer sur `http://localhost:3000` (ou le port défini par la variable d'environnement `PORT`).

### 2. Créer un nouveau projet sur Railway

1. **Connectez-vous à Railway** : https://railway.app
2. **Cliquez sur "New Project"**
3. **Sélectionnez "Deploy from GitHub repo"** (ou votre Git provider)
4. **Autorisez Railway** à accéder à votre repository
5. **Sélectionnez le repository** contenant ce projet

### 3. Configuration automatique

Railways détectera automatiquement :
- ✅ `package.json` avec le script `start`
- ✅ `nixpacks.toml` pour la configuration du build
- ✅ Le serveur Express dans `server-frontend.js`

### 4. Variables d'environnement (recommandé)

**⚠️ Important pour l'API backend :**

Si votre backend est séparé du frontend, vous devez configurer `VITE_API_URL` :

1. Ouvrez votre projet sur Railway
2. Allez dans l'onglet **"Variables"**
3. Ajoutez la variable :
   - **Name** : `VITE_API_URL`
   - **Value** : `https://votre-backend.railway.app/api` (remplacez par votre URL backend)

**Note :** Les variables commençant par `VITE_` sont injectées pendant le build. Si vous changez cette variable, Railway redéploiera automatiquement.

Pour plus de détails, consultez : **`docs/VARIABLES-ENVIRONNEMENT.md`**

### 5. Déploiement

Railway va automatiquement :
1. **Installer les dépendances** : `npm ci`
2. **Builder l'application** : `npm run build`
3. **Démarrer le serveur** : `npm start`

### 6. Accéder à votre application

Une fois le déploiement terminé :
1. Railway génère automatiquement une URL (ex: `https://votre-app.railway.app`)
2. Vous pouvez aussi configurer un domaine personnalisé dans les paramètres

## 📁 Structure pour Railways

```
loterie/
├── server-frontend.js     # Serveur Express pour servir le frontend
├── package.json           # Scripts de build et start
├── nixpacks.toml          # Configuration Railway (Nixpacks)
├── railway.json           # Configuration Railway alternative
├── vite.config.js         # Configuration Vite optimisée
├── dist/                  # Dossier généré par npm run build (pas dans Git)
└── src/                   # Code source React
```

## 📄 Fichiers de Configuration

### `nixpacks.toml`
Configuration principale pour Railway utilisant Nixpacks. Définit :
- Node.js version
- Commandes de build et démarrage
- Variables d'environnement par défaut

### `railway.json`
Configuration alternative au format JSON pour Railway.

### `server-frontend.js`
Serveur Express qui :
- Sert les fichiers statiques du build
- Gère les routes SPA (Single Page Application)
- Configure CORS
- Gère les erreurs gracieusement

## 🔧 Scripts disponibles

- `npm run build` : Crée le build de production dans `dist/`
- `npm start` : Démarre le serveur Express pour servir le frontend
- `npm run start:frontend` : Alias pour `npm start`
- `npm run start:backend` : Démarre le backend (si nécessaire)

## ⚠️ Important

1. **Le dossier `dist/` ne doit PAS être commité** dans Git (déjà dans `.gitignore`)
   - Railway rebuild l'application à chaque déploiement

2. **Le fichier `resultats-cache.json` doit être présent** dans le dossier `dist/` après le build
   - Il est automatiquement copié par `vite.config.js` pendant le build

3. **Port dynamique** : Railway définit automatiquement la variable `PORT`
   - Le serveur écoute sur `process.env.PORT` ou `3000` par défaut
   - Le serveur écoute sur `0.0.0.0` pour accepter les connexions externes

4. **Variables d'environnement `VITE_*`** : Ces variables sont injectées pendant le build
   - Pour changer `VITE_API_URL`, Railway redéploiera automatiquement
   - Consultez `docs/VARIABLES-ENVIRONNEMENT.md` pour plus d'informations

## 🐛 Dépannage

### Erreur : "Le dossier dist/ n'existe pas !"
- **Solution** : Vérifiez que le build s'exécute correctement dans Railway
- Vérifiez les logs de build dans Railway Dashboard

### Erreur : "Cannot find module"
- **Solution** : Vérifiez que toutes les dépendances sont dans `dependencies` et non `devDependencies`
- Le serveur frontend nécessite `express` qui est déjà dans les dépendances

### L'application ne se charge pas
- **Solution** : Vérifiez les logs dans Railway Dashboard
- Vérifiez que le build s'est bien terminé sans erreurs
- Vérifiez que le port est correctement configuré
- Vérifiez que `VITE_API_URL` est correctement défini si vous utilisez un backend séparé

### L'API ne fonctionne pas
- **Solution** : Vérifiez que `VITE_API_URL` est défini dans les variables d'environnement
- Assurez-vous que l'URL se termine par `/api`
- Vérifiez que le backend est accessible et répond correctement
- Consultez `docs/VARIABLES-ENVIRONNEMENT.md` pour plus de détails

## 📝 Notes

- Railway détecte automatiquement les changements sur la branche principale
- Chaque push déclenche un nouveau déploiement
- Les logs sont disponibles en temps réel dans Railway Dashboard

## 🔄 Mise à jour

Pour mettre à jour l'application :
1. Modifiez le code localement
2. Commit et push vers votre repository
3. Railway détecte les changements et redéploie automatiquement

## 📚 Documentation Complémentaire

- **`docs/VARIABLES-ENVIRONNEMENT.md`** : Guide complet des variables d'environnement
- **`docs/DEPLOIEMENT-RAILWAYS.md`** : Ce guide (déploiement frontend)
- **`README.md`** : Documentation générale du projet

## ✨ Améliorations Incluses

Le déploiement sur Railway inclut :
- ✅ Serveur Express optimisé avec gestion d'erreurs
- ✅ Configuration CORS pour les requêtes cross-origin
- ✅ Support SPA (toutes les routes pointent vers `index.html`)
- ✅ Gestion gracieuse de l'arrêt (SIGTERM/SIGINT)
- ✅ Logs détaillés avec URL publique
- ✅ Build optimisé avec code splitting
- ✅ Configuration flexible via variables d'environnement

---

✅ Votre frontend est maintenant prêt pour Railway !

