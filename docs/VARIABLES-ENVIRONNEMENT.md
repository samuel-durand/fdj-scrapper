# 🔧 Variables d'Environnement pour Railways

Guide des variables d'environnement nécessaires pour le déploiement sur Railway.

## 📋 Variables Disponibles

### Variables Obligatoires (automatiques sur Railway)

Railway définit automatiquement ces variables :

| Variable | Description | Valeur |
|----------|-------------|--------|
| `PORT` | Port sur lequel le serveur écoute | Défini automatiquement par Railway |
| `NODE_ENV` | Environnement d'exécution | `production` (défini dans nixpacks.toml) |
| `RAILWAY_PUBLIC_DOMAIN` | Domaine public de l'application | Ex: `votre-app.railway.app` |

### Variables Optionnelles (à configurer manuellement)

Ces variables doivent être configurées dans Railway Dashboard :

#### `VITE_API_URL`

URL de l'API backend si elle est séparée du frontend.

**Exemples :**
```
# Backend sur Railway séparé
VITE_API_URL=https://votre-backend.railway.app/api

# Backend sur un autre service
VITE_API_URL=https://api.votre-domaine.com/api

# Backend local (développement uniquement)
VITE_API_URL=http://localhost:5000/api
```

**⚠️ Important :**
- L'URL doit se terminer par `/api`
- Utilisez toujours `https://` en production
- Si laissée vide, l'application utilisera `/api` (même domaine)

## 🔨 Configuration dans Railway

### Méthode 1 : Interface Web

1. **Ouvrez votre projet** sur Railway Dashboard
2. Allez dans l'onglet **"Variables"**
3. Cliquez sur **"New Variable"**
4. Ajoutez :
   - **Name** : `VITE_API_URL`
   - **Value** : `https://votre-backend.railway.app/api`
5. Cliquez sur **"Add"**

### Méthode 2 : Railway CLI

```bash
# Installer Railway CLI
npm i -g @railway/cli

# Se connecter
railway login

# Lier au projet
railway link

# Ajouter une variable
railway variables set VITE_API_URL=https://votre-backend.railway.app/api
```

## 🔄 Variables et Build

**Important :** Les variables commençant par `VITE_` sont injectées **pendant le build**, pas au runtime.

Cela signifie :
- ✅ Elles sont incluses dans le bundle JavaScript final
- ⚠️ Elles ne peuvent pas être modifiées sans rebuilder
- 🔄 Pour changer `VITE_API_URL`, vous devez redéployer

### Workflow recommandé

1. **Définissez `VITE_API_URL`** dans Railway avant le premier déploiement
2. Railway va automatiquement rebuilder si vous changez la variable
3. Si vous changez la variable après le déploiement, Railway redéploie automatiquement

## 📝 Exemple de Configuration Complète

Dans Railway Dashboard, ajoutez :

```
VITE_API_URL=https://mon-backend.railway.app/api
NODE_ENV=production
```

Le fichier `nixpacks.toml` définit déjà `NODE_ENV=production`, mais vous pouvez le surcharger si nécessaire.

## 🧪 Test Local

Pour tester avec les mêmes variables que Railway :

1. Créez un fichier `.env` (ne pas commiter dans Git)
2. Ajoutez :
```env
VITE_API_URL=http://localhost:5000/api
PORT=3000
NODE_ENV=production
```

3. Lancez :
```bash
npm run build
npm start
```

## ⚠️ Sécurité

- ❌ Ne commitez JAMAIS de fichiers `.env` contenant des secrets
- ✅ Utilisez toujours `https://` en production
- ✅ Configurez CORS sur le backend si nécessaire
- ✅ Validez toutes les URLs dans l'interface Railway

---

✅ Avec ces variables configurées, votre application devrait fonctionner correctement sur Railway !

