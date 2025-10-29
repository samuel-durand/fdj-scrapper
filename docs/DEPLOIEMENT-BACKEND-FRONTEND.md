# 🚀 Déploiement Backend + Frontend

## 📋 Situation actuelle

- **Frontend** : React (peut être déployé sur o2switch ✅)
- **Backend** : Node.js + Express + MongoDB (ne peut PAS tourner sur o2switch ❌)

## ⚠️ Problème avec o2switch

O2switch est un **hébergement mutualisé** qui supporte uniquement :
- ✅ HTML/CSS/JavaScript
- ✅ PHP
- ✅ MySQL
- ❌ **Node.js** (non supporté)
- ❌ **MongoDB** (non supporté)

## 💡 Solution recommandée

### Architecture hybride (GRATUIT!)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  Frontend (React)     →    o2switch             │
│  http://resultat-fdj.soqe8286.odns.fr          │
│                                                 │
└─────────────────┬───────────────────────────────┘
                  │
                  │ API Calls
                  ↓
┌─────────────────────────────────────────────────┐
│                                                 │
│  Backend (Node.js)    →    Render/Railway      │
│  https://mon-backend.onrender.com               │
│                                                 │
└─────────────────┬───────────────────────────────┘
                  │
                  │ Database
                  ↓
┌─────────────────────────────────────────────────┐
│                                                 │
│  MongoDB              →    MongoDB Atlas        │
│  (Base de données gratuite)                     │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Option 1 : Render.com (RECOMMANDÉ - GRATUIT)

### Avantages
- ✅ **100% gratuit** pour les petits projets
- ✅ Support Node.js natif
- ✅ Déploiement automatique depuis GitHub
- ✅ HTTPS automatique
- ✅ Simple à configurer

### 1️⃣ Créer un compte Render

1. Aller sur https://render.com
2. S'inscrire avec GitHub
3. Autoriser l'accès à ton repository

### 2️⃣ Préparer le backend pour le déploiement

Créer `backend/render.yaml` :

```yaml
services:
  - type: web
    name: loterie-backend
    env: node
    region: frankfurt
    plan: free
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: FRONTEND_URL
        value: http://resultat-fdj.soqe8286.odns.fr
```

### 3️⃣ Déployer sur Render

1. **Dashboard Render** → "New" → "Web Service"
2. **Connecter** ton repo GitHub
3. **Root Directory** : `backend`
4. **Build Command** : `npm install`
5. **Start Command** : `npm start`
6. **Ajouter les variables d'environnement** :
   - `MONGODB_URI` : (voir MongoDB Atlas ci-dessous)
   - `JWT_SECRET` : `ton_secret_super_securise_123456`
   - `FRONTEND_URL` : `http://resultat-fdj.soqe8286.odns.fr`
7. **Créer le service** → Attendre le déploiement (~5 min)

### 4️⃣ Récupérer l'URL du backend

Une fois déployé, Render te donne une URL comme :
```
https://loterie-backend.onrender.com
```

---

## 🗄️ MongoDB Atlas (Base de données GRATUITE)

### 1️⃣ Créer un compte MongoDB Atlas

1. Aller sur https://www.mongodb.com/cloud/atlas
2. S'inscrire (gratuit)
3. Créer un cluster gratuit (M0 - FREE)

### 2️⃣ Configuration

1. **Database Access** :
   - Créer un utilisateur
   - Username : `loterie-admin`
   - Password : (note-le bien !)

2. **Network Access** :
   - Add IP Address → "Allow Access from Anywhere" (0.0.0.0/0)

3. **Connect** :
   - Cliquer sur "Connect"
   - Choisir "Connect your application"
   - Copier la connection string :
   ```
   mongodb+srv://loterie-admin:<password>@cluster0.xxxxx.mongodb.net/loterie-fdj?retryWrites=true&w=majority
   ```
   - Remplacer `<password>` par ton mot de passe

### 3️⃣ Ajouter à Render

Dans les variables d'environnement Render :
- `MONGODB_URI` = `mongodb+srv://loterie-admin:TON_PASSWORD@cluster0.xxxxx.mongodb.net/loterie-fdj`

---

## 🌐 Configurer le Frontend sur o2switch

### 1️⃣ Créer le fichier `.env.production`

Dans le dossier racine (frontend) :

```env
VITE_API_URL=https://loterie-backend.onrender.com/api
```

### 2️⃣ Modifier `src/services/api.js`

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const api = {
  async get(endpoint) {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    })
    return response.json()
  },
  
  async post(endpoint, data) {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    return response.json()
  },
  
  async put(endpoint, data) {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    return response.json()
  },
  
  async delete(endpoint) {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    })
    return response.json()
  }
}
```

### 3️⃣ Build et déployer

```bash
# Build avec l'API de production
npm run build

# Upload dist/ vers o2switch via FTP
# (comme d'habitude)
```

---

## 🎯 Option 2 : Railway.app (Alternative gratuite)

### Avantages
- ✅ Gratuit ($5 de crédit/mois)
- ✅ Plus simple que Render
- ✅ Déploiement automatique

### Déploiement

1. Aller sur https://railway.app
2. Connecter GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Sélectionner ton repo
5. Ajouter les variables :
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `FRONTEND_URL`
6. Déployer !

---

## 🎯 Option 3 : Heroku (Payant maintenant)

⚠️ Heroku n'est plus gratuit depuis novembre 2022.
Coût : ~7$/mois minimum

---

## 📋 Checklist complète

### Backend (Render/Railway)

- [ ] Créer un compte sur Render.com ou Railway.app
- [ ] Connecter le repository GitHub
- [ ] Configurer les variables d'environnement
- [ ] Déployer le backend
- [ ] Récupérer l'URL du backend (ex: `https://loterie-backend.onrender.com`)
- [ ] Créer un admin : `npm run create-admin` (en local puis push la DB)

### MongoDB Atlas

- [ ] Créer un compte MongoDB Atlas
- [ ] Créer un cluster gratuit (M0)
- [ ] Créer un utilisateur de base de données
- [ ] Autoriser l'accès réseau (0.0.0.0/0)
- [ ] Copier la connection string
- [ ] L'ajouter dans Render/Railway

### Frontend (o2switch)

- [ ] Créer `.env.production` avec `VITE_API_URL`
- [ ] Vérifier que `src/services/api.js` utilise la variable d'environnement
- [ ] Build : `npm run build`
- [ ] Upload `dist/` vers o2switch via FTP
- [ ] Tester l'application en ligne

---

## 🧪 Test de l'installation

### 1. Tester le backend

```bash
# Ouvrir dans le navigateur
https://loterie-backend.onrender.com/api/health

# Devrait retourner
{"status":"OK","message":"Server is running"}
```

### 2. Tester le frontend

```bash
# Ouvrir
http://resultat-fdj.soqe8286.odns.fr

# Essayer de :
- S'inscrire
- Se connecter
- Générer des numéros
- Sauvegarder une combinaison
```

---

## ⚡ Déploiement automatique

### GitHub Actions → Render

Render redémarre automatiquement à chaque push sur `main` ! Aucune configuration supplémentaire.

### GitHub Actions → o2switch (Frontend)

Le workflow existe déjà dans `.github/workflows/update-fdj.yml`

Pour ajouter le build du frontend :

```yaml
- name: 📦 Build du frontend
  run: |
    npm install
    npm run build

- name: 🌐 Upload vers o2switch via FTP
  uses: SamKirkland/FTP-Deploy-Action@v4.3.5
  with:
    server: ${{ secrets.FTP_SERVER }}
    username: ${{ secrets.FTP_USERNAME }}
    password: ${{ secrets.FTP_PASSWORD }}
    protocol: ftps
    port: 21
    local-dir: ./dist/
    server-dir: /resultat-fdj.soqe8286.odns.fr/
```

---

## 💰 Coûts

| Service | Coût | Limites |
|---------|------|---------|
| **Render (Free)** | 0€ | 750h/mois, redémarre après 15min d'inactivité |
| **Railway (Free)** | 0€ | 5$ de crédit/mois, ~500h |
| **MongoDB Atlas (M0)** | 0€ | 512 MB storage |
| **o2switch** | Déjà payé | ∞ (hébergement mutualisé) |
| **TOTAL** | **0€/mois** | Parfait pour un projet perso ! |

---

## 🔥 Problèmes courants

### 1. CORS Error

**Problème** : Le frontend ne peut pas accéder au backend

**Solution** : Dans `backend/server.js` :

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

### 2. Backend qui dort (Render Free)

**Problème** : Le backend Render s'endort après 15 min d'inactivité

**Solutions** :
- Utiliser un service de ping (UptimeRobot, gratuit)
- Passer à Render Paid ($7/mois)
- Accepter les 10-15s de délai au réveil

### 3. Connection MongoDB timeout

**Problème** : `MongoNetworkError`

**Solution** :
- Vérifier Network Access (0.0.0.0/0)
- Vérifier la connection string
- Vérifier le mot de passe (pas de caractères spéciaux)

---

## 🎉 Conclusion

**Architecture finale** :
```
Frontend (React)     →  o2switch (gratuit si déjà payé)
Backend (Node.js)    →  Render.com (gratuit)
Database (MongoDB)   →  MongoDB Atlas (gratuit)
```

**Avantages** :
- ✅ 100% gratuit
- ✅ Scalable
- ✅ Déploiement automatique
- ✅ HTTPS partout
- ✅ Séparation des préoccupations

**Prêt à déployer ? Suis les étapes ci-dessus ! 🚀**

