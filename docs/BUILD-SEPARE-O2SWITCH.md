# 🏗️ Build Séparé - Frontend o2switch + Backend ailleurs

## 🎯 Architecture classique

```
Frontend (React)      →  o2switch
                         http://resultat-fdj.soqe8286.odns.fr

Backend (Node.js)     →  Render / VPS / Autre
                         https://api.resultat-fdj.soqe8286.odns.fr
                         (ou https://ton-backend.onrender.com)

MongoDB               →  MongoDB Atlas
```

---

## 📦 Build du Frontend pour o2switch

### Étape 1 : Créer `.env.production`

Créer le fichier à la racine du projet :

```env
# URL de ton backend en production
VITE_API_URL=https://api.resultat-fdj.soqe8286.odns.fr/api

# OU si pas de sous-domaine configuré :
# VITE_API_URL=https://ton-backend.onrender.com/api
```

### Étape 2 : Vérifier que l'API utilise la variable

Dans `src/services/api.js`, vérifier :

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
```

✅ Si c'est déjà configuré, tu n'as rien à faire.

### Étape 3 : Build le frontend

```bash
npm run build
```

Cela crée le dossier `dist/` avec :
- `index.html`
- `assets/` (CSS, JS optimisés)
- `resultats-cache.json` (si présent)

### Étape 4 : Upload vers o2switch

**Via FTP** (FileZilla, WinSCP, etc.) :
```
Local : dist/*
Remote : /home/ton-user/www/resultat-fdj.soqe8286.odns.fr/
```

**Fichiers à uploader** :
- ✅ `index.html`
- ✅ `assets/` (tout le dossier)
- ✅ `resultats-cache.json`
- ✅ `.htaccess` (si tu en as un)

---

## 🔧 Backend (reste séparé)

### Option A : Render.com avec sous-domaine

1. **Déployer sur Render** (voir guides précédents)
2. **Configurer le sous-domaine** o2switch → Render
3. **URL finale** : `https://api.resultat-fdj.soqe8286.odns.fr`

### Option B : Render.com sans sous-domaine

1. **Déployer sur Render**
2. **URL finale** : `https://ton-backend.onrender.com`
3. **Dans `.env.production`** : `VITE_API_URL=https://ton-backend.onrender.com/api`

### Option C : VPS personnel

Si tu as un VPS :
1. Installer Node.js
2. Installer PM2
3. Déployer le backend
4. Configurer Nginx
5. SSL avec Let's Encrypt

---

## 📝 Fichier `.env.production` complet

```env
# ===========================================
# CONFIGURATION PRODUCTION
# ===========================================

# URL de l'API backend
# Choisir UNE des options suivantes :

# Option 1 : Avec sous-domaine o2switch → Render
VITE_API_URL=https://api.resultat-fdj.soqe8286.odns.fr/api

# Option 2 : URL Render directe
# VITE_API_URL=https://loterie-backend.onrender.com/api

# Option 3 : VPS personnel
# VITE_API_URL=https://api.mondomaine.com/api

# ===========================================
# NOTES
# ===========================================
# - Utiliser HTTPS en production
# - Toujours terminer par /api
# - Pas de slash final après /api
```

---

## 🚀 Script de build automatique

### Windows : `scripts/build-et-upload-o2switch.bat`

```batch
@echo off
chcp 65001 >nul
echo.
echo ════════════════════════════════════════════════════
echo    📦 BUILD FRONTEND POUR O2SWITCH
echo ════════════════════════════════════════════════════
echo.

cd ..

echo 1️⃣  Vérification de .env.production...
if not exist .env.production (
    echo ❌ ERREUR : .env.production n'existe pas !
    echo.
    echo Créer le fichier .env.production avec :
    echo VITE_API_URL=https://api.resultat-fdj.soqe8286.odns.fr/api
    pause
    exit /b 1
)

echo ✅ .env.production trouvé
echo.

echo 2️⃣  Build du frontend...
call npm run build

if errorlevel 1 (
    echo ❌ Erreur lors du build !
    pause
    exit /b 1
)

echo ✅ Build terminé
echo.

echo ════════════════════════════════════════════════════
echo    ✅ PRÊT POUR L'UPLOAD !
echo ════════════════════════════════════════════════════
echo.
echo 📁 Dossier dist\ créé avec succès
echo.
echo 📤 PROCHAINE ÉTAPE :
echo    Upload dist\* vers o2switch via FTP
echo.
echo    Serveur  : ftp.soqe8286.odns.fr
echo    Dossier  : /resultat-fdj.soqe8286.odns.fr/
echo.
pause
```

### Linux/Mac : `scripts/build-frontend.sh`

```bash
#!/bin/bash

echo ""
echo "════════════════════════════════════════════════════"
echo "   📦 BUILD FRONTEND POUR O2SWITCH"
echo "════════════════════════════════════════════════════"
echo ""

cd "$(dirname "$0")/.."

echo "1️⃣  Vérification de .env.production..."
if [ ! -f .env.production ]; then
    echo "❌ ERREUR : .env.production n'existe pas !"
    echo ""
    echo "Créer le fichier .env.production avec :"
    echo "VITE_API_URL=https://api.resultat-fdj.soqe8286.odns.fr/api"
    exit 1
fi

echo "✅ .env.production trouvé"
echo ""

echo "2️⃣  Build du frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du build !"
    exit 1
fi

echo "✅ Build terminé"
echo ""

echo "════════════════════════════════════════════════════"
echo "   ✅ PRÊT POUR L'UPLOAD !"
echo "════════════════════════════════════════════════════"
echo ""
echo "📁 Dossier dist/ créé avec succès"
echo ""
echo "📤 PROCHAINE ÉTAPE :"
echo "   Upload dist/* vers o2switch via FTP"
echo ""
```

---

## 📋 Checklist complète

### Frontend (o2switch)

- [ ] Créer `.env.production` avec l'URL du backend
- [ ] Vérifier que `src/services/api.js` utilise `import.meta.env.VITE_API_URL`
- [ ] Build : `npm run build`
- [ ] Tester le build localement : `npm run preview`
- [ ] Upload `dist/*` vers o2switch via FTP
- [ ] Vérifier : `http://resultat-fdj.soqe8286.odns.fr`

### Backend (Render/VPS/Autre)

- [ ] Déployer le backend
- [ ] Configurer MongoDB Atlas
- [ ] Ajouter les variables d'environnement
- [ ] Tester l'API : `https://api.../api/health`
- [ ] Créer un utilisateur admin

### Configuration CORS

Dans `backend/server.js`, vérifier :

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://resultat-fdj.soqe8286.odns.fr',
    'https://resultat-fdj.soqe8286.odns.fr'
  ],
  credentials: true
}))
```

---

## 🧪 Tester le build localement

Avant d'uploader sur o2switch :

```bash
# Build
npm run build

# Tester localement
npm run preview

# Ouvrir http://localhost:4173
```

Vérifier :
- ✅ La page s'affiche
- ✅ Navigation fonctionne
- ✅ Les appels API se font vers la bonne URL
- ✅ Connexion/inscription fonctionne

---

## 📤 Upload automatique (optionnel)

Si tu veux automatiser l'upload FTP, tu peux utiliser WinSCP en ligne de commande.

### `scripts/upload-ftp.bat`

```batch
@echo off
echo Upload vers o2switch via WinSCP...

"C:\Program Files (x86)\WinSCP\WinSCP.com" ^
  /command ^
  "open ftp://username:password@ftp.soqe8286.odns.fr" ^
  "cd /resultat-fdj.soqe8286.odns.fr/" ^
  "put dist\* ." ^
  "exit"

echo Upload terminé !
pause
```

⚠️ **Attention** : Ne jamais commit les mots de passe !

---

## 🔄 Workflow complet de déploiement

### 1. Backend (une fois)

```bash
# Déployer sur Render
# Configurer MongoDB Atlas
# Créer l'admin
```

### 2. Frontend (à chaque mise à jour)

```bash
# Build
npm run build

# Upload via FTP
# (manuellement ou script)

# Tester
# https://resultat-fdj.soqe8286.odns.fr
```

### 3. Scraper (quotidien)

GitHub Actions fait ça automatiquement à 22h30 ! ✅

---

## 💡 Commandes rapides

```bash
# Build frontend uniquement
npm run build

# Build + tester localement
npm run build && npm run preview

# Build + voir la taille
npm run build
ls -lh dist/
```

---

## 🎯 Différence avec le build unifié

### Build séparé (ce guide)
```
Frontend  → o2switch (fichiers statiques)
Backend   → Render (serveur Node.js)
2 déploiements distincts
```

### Build unifié (l'autre approche)
```
Frontend + Backend → Render (tout ensemble)
1 seul déploiement
```

**Quand utiliser le build séparé ?**
- ✅ Tu veux garder o2switch pour le frontend
- ✅ Tu veux des déploiements indépendants
- ✅ Tu as déjà payé o2switch

---

## 🎉 Conclusion

**Build séparé = Simple et classique**

1. Frontend sur o2switch (fichiers statiques)
2. Backend sur Render (Node.js)
3. Deux builds indépendants
4. Fonctionne parfaitement !

**Prêt à builder ? Lance `npm run build` ! 🚀**

