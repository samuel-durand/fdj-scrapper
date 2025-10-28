# ⚡ Démarrage Rapide - Backend JWT

## 🚀 En 5 minutes !

### Option 1 : MongoDB Atlas (Cloud - RECOMMANDÉ)

```bash
# 1. Créer compte MongoDB Atlas
# → https://www.mongodb.com/cloud/atlas/register
# → Créer cluster gratuit M0
# → Récupérer connection string

# 2. Installer dépendances backend
cd backend
npm install

# 3. Créer .env
copy .env.example .env

# 4. Éditer .env (remplacer les valeurs)
notepad .env

# 5. Lancer backend
npm run dev

# 6. Nouveau terminal → Lancer frontend
cd ..
npm run dev

# ✅ TERMINÉ ! Testez l'inscription
```

### Option 2 : MongoDB Local

```bash
# 1. Installer MongoDB
# → https://www.mongodb.com/try/download/community

# 2. Installer dépendances
cd backend
npm install

# 3. Créer .env
copy .env.example .env

# 4. Garder valeurs par défaut dans .env
# (MongoDB local : mongodb://localhost:27017/loterie-fdj)

# 5. Lancer backend
npm run dev

# 6. Nouveau terminal → Lancer frontend
cd ..
npm run dev

# ✅ TERMINÉ ! Testez l'inscription
```

---

## 📝 Configuration minimale (.env)

```env
# Backend
MONGODB_URI=votre_connection_string_ici
JWT_SECRET=changez_moi_32_caracteres_minimum_abc123xyz
JWT_REFRESH_SECRET=autre_secret_32_caracteres_def456uvw
```

```env
# Frontend (racine du projet)
VITE_API_URL=http://localhost:5000/api
```

---

## ✅ Vérification rapide

1. **Backend OK ?**
   - Ouvrir http://localhost:5000/api/health
   - Doit afficher : `{"status":"OK"}`

2. **Frontend OK ?**
   - Ouvrir http://localhost:5173
   - Cliquer "Inscription"
   - Créer un compte
   - ✅ Si ça marche = TOUT EST BON !

---

## 🐛 Problème ?

### "MongoDB connection error"
```bash
# Atlas : Vérifier connection string dans .env
# Local : Démarrer MongoDB
net start MongoDB
```

### "Cannot find module"
```bash
cd backend
npm install
```

### "CORS Error"
```bash
# Vérifier FRONTEND_URL dans backend/.env
FRONTEND_URL=http://localhost:5173
```

---

## 📚 Documentation complète

- **Installation détaillée** : `BACKEND_INSTALLATION.md`
- **Résumé complet** : `BACKEND_JWT_README.md`
- **API** : `backend/README.md`

---

**C'est tout ! Votre backend sécurisé est prêt ! 🎉**

