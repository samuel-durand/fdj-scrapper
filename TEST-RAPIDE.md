# 🔍 Test Rapide de Connexion MongoDB

## Étape 1 : Créer le fichier .env

Créez un fichier `.env` à la racine avec vos vraies valeurs :

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://fdj_db_user:VOTRE_MOT_DE_PASSE@fjd.c4zt5vn.mongodb.net/fdj?retryWrites=true&w=majority&appName=fjd
JWT_SECRET=test_secret_local_32_caracteres_minimum_abc123
FRONTEND_URL=http://localhost:5173
```

**Remplacez `VOTRE_MOT_DE_PASSE` par votre vrai mot de passe !**

## Étape 2 : Tester la connexion

```bash
npm run test-db
```

### ✅ Si ça fonctionne :

Vous verrez :
```
✅ ✅ ✅ CONNEXION RÉUSSIE ! ✅ ✅ ✅
- Host: fjd.c4zt5vn.mongodb.net
- Database: fdj
🎉 MongoDB fonctionne correctement !
```

**➜ Alors le problème est sur Render, pas dans votre configuration !**

### ❌ Si ça échoue :

Le script vous dira exactement quel est le problème :

**"bad auth"** :
```
➜ Username ou password incorrect
➜ Allez sur MongoDB Atlas → Database Access
➜ Vérifiez l'utilisateur fdj_db_user
```

**"ENOTFOUND"** :
```
➜ URI MongoDB incorrect
➜ Vérifiez le format de MONGODB_URI dans .env
```

**"connect refused"** :
```
➜ Network Access non configuré
➜ Allez sur MongoDB Atlas → Network Access
➜ Ajoutez 0.0.0.0/0
```

## Étape 3 : Si le test local fonctionne

Alors le problème est sur Render. Vérifiez :

### A) La bonne branche

Dashboard Render → Settings → Build & Deploy :
- **Branch** doit être : `backend` (PAS `main`)

### B) Les variables d'environnement

Dashboard Render → Environment → Vérifiez que vous avez :

```
NODE_ENV = production
MONGODB_URI = mongodb+srv://fdj_db_user:VOTRE_MOT_DE_PASSE@fjd.c4zt5vn.mongodb.net/fdj?retryWrites=true&w=majority&appName=fjd
JWT_SECRET = (votre clé de 32+ caractères)
FRONTEND_URL = https://votre-domaine.o2switch.com
```

**Erreurs fréquentes** :
- ❌ Espaces avant/après les valeurs
- ❌ Guillemets autour des valeurs (ne pas en mettre !)
- ❌ Mauvaise branche (main au lieu de backend)

### C) Les logs Render

Dashboard Render → Logs → Cherchez le message d'erreur exact

Copiez-collez le message d'erreur ici, je vous aiderai !

## 🆘 Aide rapide

**Si le test local fonctionne** ✅ mais **Render échoue** ❌ :
- Le problème est dans la configuration Render, pas MongoDB
- Vérifiez la branche = `backend`
- Vérifiez les variables d'environnement sur Render

**Si le test local échoue** ❌ :
- Le problème est dans votre configuration MongoDB
- Suivez les solutions proposées par le script

