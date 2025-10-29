# 🏗️ Build Complet - Frontend + Backend

## 🎯 Principe

Au lieu de déployer le frontend et le backend séparément, on va :
1. **Builder le frontend** → Crée le dossier `dist/`
2. **Le backend sert le frontend** → Express sert les fichiers statiques
3. **Une seule URL** → Tout est sur le même domaine (pas de CORS!)

## ✨ Avantages

✅ **Une seule URL** : `https://ton-app.onrender.com`  
✅ **Pas de problèmes CORS** : Même domaine pour API et frontend  
✅ **Plus simple** : Un seul déploiement  
✅ **Moins cher** : Un seul serveur au lieu de deux  

---

## 🚀 Méthode 1 : Build automatique avec script

### Commande unique

```bash
npm run build:all
```

### Ce que ça fait

1. ✅ Crée `.env.production` avec `VITE_API_URL=/api`
2. ✅ Build le frontend → `dist/`
3. ✅ Installe les dépendances backend
4. ✅ Prépare tout pour le déploiement

---

## 🔧 Méthode 2 : Build manuel étape par étape

### 1. Créer `.env.production`

```env
# API URL pour la production
VITE_API_URL=/api
```

⚠️ **Important** : Utiliser `/api` (URL relative) car le backend servira le frontend sur le même domaine.

### 2. Build le frontend

```bash
npm run build
```

Cela crée le dossier `dist/` avec :
- `index.html`
- `assets/` (CSS, JS compilés)

### 3. Vérifier le backend

Le fichier `backend/server.js` a été modifié pour servir le frontend :

```javascript
// En production, servir les fichiers statiques du frontend
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '..', 'dist')
  app.use(express.static(frontendPath))
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'))
  })
}
```

### 4. Tester en local

```bash
cd backend
NODE_ENV=production npm start
```

Ouvrir : `http://localhost:5000`

✅ Tu devrais voir ton frontend React  
✅ Les appels API se font vers `/api/*`  

---

## 📦 Structure finale

```
loterie/
├── dist/                    ← Frontend buildé
│   ├── index.html
│   └── assets/
│       ├── index-xxx.js
│       └── index-xxx.css
│
├── backend/                 ← Backend qui sert le frontend
│   ├── server.js           ← Modifié pour servir dist/
│   ├── routes/
│   ├── models/
│   └── package.json
│
├── build-all.js            ← Script de build automatique
└── .env.production         ← Config pour production
```

---

## 🌐 Déploiement sur Render.com

### Configuration Render

1. **Root Directory** : Laisser vide (racine du projet)
2. **Build Command** :
   ```bash
   npm run build:all && cd backend && npm install
   ```
3. **Start Command** :
   ```bash
   cd backend && NODE_ENV=production npm start
   ```

### Variables d'environnement

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=ton_secret_securise
PORT=5000
```

⚠️ **Important** : Ne PAS mettre `FRONTEND_URL` car tout est sur le même domaine !

### Résultat

Une seule URL : `https://loterie-backend.onrender.com`

- **Frontend** : `https://loterie-backend.onrender.com/`
- **API** : `https://loterie-backend.onrender.com/api/...`

---

## 🧪 Tester le build complet

### 1. Build

```bash
npm run build:all
```

### 2. Lancer en mode production

```bash
cd backend
set NODE_ENV=production
npm start
```

Sur Windows PowerShell :
```powershell
cd backend
$env:NODE_ENV="production"
npm start
```

### 3. Tester

Ouvrir : `http://localhost:5000`

**Vérifier** :
- ✅ Page d'accueil s'affiche
- ✅ Navigation entre onglets fonctionne
- ✅ Connexion/Inscription fonctionne
- ✅ Génération de numéros fonctionne
- ✅ Sauvegarde de combinaisons fonctionne
- ✅ Panel admin accessible

### 4. Vérifier les appels API

Ouvrir la console du navigateur (F12) → Network

Les requêtes doivent pointer vers :
```
http://localhost:5000/api/auth/login
http://localhost:5000/api/combinations
etc.
```

✅ Tout est sur le même domaine → Pas de CORS !

---

## 📝 Fichier render.yaml (optionnel)

Pour automatiser le déploiement Render :

```yaml
services:
  - type: web
    name: loterie-fullstack
    env: node
    region: frankfurt
    plan: free
    buildCommand: npm run build:all && cd backend && npm install
    startCommand: cd backend && NODE_ENV=production npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        sync: false
```

---

## 🔥 Problèmes courants

### 1. "Cannot GET /" en production

**Cause** : Le frontend n'est pas trouvé

**Solution** : Vérifier que :
- `dist/` existe à la racine
- `NODE_ENV=production` est défini
- Le path dans `server.js` est correct

### 2. Les API calls ne fonctionnent pas

**Cause** : `VITE_API_URL` n'est pas configuré

**Solution** :
- Vérifier `.env.production` : `VITE_API_URL=/api`
- Rebuild : `npm run build`

### 3. 404 sur les routes React

**Cause** : Le serveur ne renvoie pas `index.html` pour toutes les routes

**Solution** : Vérifier le wildcard `app.get('*')` dans `server.js`

### 4. CORS errors

**Cause** : Devrait PAS arriver si tout est sur le même domaine !

**Solution** : Vérifier que tu n'utilises pas d'URL absolue dans le frontend

---

## 🎯 Comparaison des approches

### Approche séparée (avant)

```
Frontend → o2switch         (http://resultat-fdj.soqe8286.odns.fr)
Backend  → Render           (https://backend.onrender.com)
```

**Problèmes** :
- ❌ 2 URLs différentes
- ❌ Problèmes CORS possibles
- ❌ 2 déploiements à gérer

### Approche unifiée (maintenant)

```
Frontend + Backend → Render  (https://loterie-app.onrender.com)
```

**Avantages** :
- ✅ 1 seule URL
- ✅ Pas de CORS
- ✅ 1 seul déploiement
- ✅ Plus simple à maintenir

---

## 💡 Commandes rapides

```bash
# Build complet
npm run build:all

# Test local en production
cd backend
set NODE_ENV=production  # Windows CMD
npm start

# Test local en dev (frontend + backend séparés)
# Terminal 1
npm run dev

# Terminal 2
cd backend
npm run dev
```

---

## 🎉 Résumé

**Pour builder le tout ensemble** :

```bash
npm run build:all
```

**Pour déployer sur Render** :

1. Push sur GitHub
2. Configurer Render :
   - Build : `npm run build:all && cd backend && npm install`
   - Start : `cd backend && NODE_ENV=production npm start`
3. Ajouter les variables d'env
4. Déployer !

**Une seule URL pour tout** : `https://ton-app.onrender.com` 🚀

