# 🔧 Debug Connexion MongoDB - Guide Complet

## Checklist de vérification

### 1️⃣ Vérifier MongoDB Atlas - Network Access

**C'est la cause n°1 des problèmes !**

1. Allez sur https://cloud.mongodb.com
2. Menu de gauche → **Network Access**
3. Vérifiez qu'il y a une entrée : **`0.0.0.0/0`** avec Status **Active**

Si ce n'est pas le cas :
- Cliquez sur **"Add IP Address"**
- Sélectionnez **"Allow Access from Anywhere"**
- Confirmez

### 2️⃣ Vérifier Database Access (utilisateur)

1. Menu de gauche → **Database Access**
2. Vérifiez que votre utilisateur existe
3. Vérifiez les privilèges : doit avoir **"Read and write to any database"**

Si l'utilisateur n'existe pas :
- Cliquez sur **"Add New Database User"**
- Username : ex. `loterie-admin`
- Password : Créez un mot de passe SANS caractères spéciaux (@, #, $, %, etc.)
- Built-in Role : **"Read and write to any database"**
- Add User

### 3️⃣ Vérifier le format de l'URI MongoDB

Le format correct est :

```
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE?retryWrites=true&w=majority
```

**Exemple concret** :
```
mongodb+srv://loterie-admin:MonMotDePasse123@cluster0.abc123.mongodb.net/loterie-fdj?retryWrites=true&w=majority
```

**Points importants** :
- ✅ Utilisez `mongodb+srv://` (pas `mongodb://`)
- ✅ Remplacez `USERNAME` par votre nom d'utilisateur
- ✅ Remplacez `PASSWORD` par votre mot de passe
- ✅ Remplacez `CLUSTER` par votre nom de cluster (ex: `cluster0.abc123`)
- ✅ Ajoutez `/loterie-fdj` après `.net` pour spécifier la base de données
- ✅ Gardez `?retryWrites=true&w=majority` à la fin

### 4️⃣ Caractères spéciaux dans le mot de passe

**Problème fréquent !**

Si votre mot de passe contient des caractères spéciaux (@, #, $, %, &, etc.), ils doivent être encodés :

| Caractère | Encodé |
|-----------|--------|
| @ | %40 |
| # | %23 |
| $ | %24 |
| % | %25 |
| & | %26 |
| + | %2B |
| / | %2F |
| : | %3A |

**Exemple** :
- Mot de passe : `Mon@Pass#123`
- Encodé : `Mon%40Pass%23123`
- URI : `mongodb+srv://user:Mon%40Pass%23123@cluster0...`

**Solution simple** : Créez un nouveau mot de passe SANS caractères spéciaux (seulement lettres et chiffres).

### 5️⃣ Obtenir le bon URI depuis MongoDB Atlas

1. Allez sur **Database** (menu de gauche)
2. Cliquez sur **"Connect"** sur votre cluster
3. Sélectionnez **"Connect your application"**
4. Driver : **Node.js**, Version : **5.5 or later**
5. Copiez la connection string :
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Remplacez `<username>` et `<password>` par vos vraies valeurs
7. Ajoutez `/loterie-fdj` après `.net` :
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/loterie-fdj?retryWrites=true&w=majority
   ```

### 6️⃣ Tester la connexion localement

Créez un fichier `.env` dans le projet backend :

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://votre_user:votre_pass@cluster0.xxxxx.mongodb.net/loterie-fdj?retryWrites=true&w=majority
JWT_SECRET=test_secret_local_32_caracteres_minimum
FRONTEND_URL=http://localhost:5173
```

Puis testez :

```bash
npm install
npm run dev
```

**Résultat attendu** :
```
✅ Connected to MongoDB
🚀 Server running on port 5000
```

**Si erreur "bad auth"** :
- Username ou password incorrect
- Vérifiez dans MongoDB Atlas → Database Access

**Si erreur "ENOTFOUND"** :
- URI incorrect
- Copiez-le à nouveau depuis MongoDB Atlas

**Si erreur "connection refused"** :
- Network Access non configuré
- Ajoutez 0.0.0.0/0

### 7️⃣ Vérifier les variables d'environnement sur Render

Sur Render Dashboard → votre service → **Environment** :

Vérifiez que vous avez bien :

```
NODE_ENV = production
MONGODB_URI = mongodb+srv://user:pass@cluster.mongodb.net/loterie-fdj?retryWrites=true&w=majority
JWT_SECRET = (votre clé de 32+ caractères)
FRONTEND_URL = https://votre-domaine.o2switch.com
```

**Erreurs fréquentes** :
- ❌ Espaces avant ou après les valeurs
- ❌ Guillemets autour des valeurs (ne pas mettre de guillemets !)
- ❌ Mot de passe mal encodé

### 8️⃣ Vérifier les logs Render

1. Dashboard Render → votre service
2. Onglet **Logs**
3. Cherchez les erreurs :

**Erreur "MongoServerError: bad auth"** :
```
➜ Username ou password incorrect
➜ Vérifiez Database Access sur MongoDB Atlas
➜ Re-créez un utilisateur avec un mot de passe simple (sans caractères spéciaux)
```

**Erreur "MongooseServerSelectionError"** :
```
➜ Network Access non configuré
➜ Ajoutez 0.0.0.0/0 dans MongoDB Atlas
```

**Erreur "ENOTFOUND cluster0.xxxxx.mongodb.net"** :
```
➜ URI MongoDB incorrect
➜ Re-copiez l'URI depuis MongoDB Atlas
```

## 🔍 Test rapide de l'URI

Utilisez cet outil en ligne pour tester votre URI :
https://mongoplayground.net/

Ou testez avec Node.js :

```bash
node -e "const mongoose = require('mongoose'); mongoose.connect('VOTRE_URI').then(() => console.log('✅ Connexion OK')).catch(err => console.log('❌ Erreur:', err.message))"
```

## ✅ Solution pas à pas

### Étape 1 : Reset complet sur MongoDB Atlas

1. **Database Access** → Supprimez l'utilisateur existant
2. **Database Access** → **Add New Database User**
   - Username : `admin-backend`
   - Password : `Pass1234` (simple, sans caractères spéciaux)
   - Role : Read and write to any database
   - Add User

3. **Network Access** → Vérifiez `0.0.0.0/0` existe
   - Si non, Add IP Address → Allow Access from Anywhere

### Étape 2 : Obtenir le nouvel URI

1. **Database** → **Connect** → **Connect your application**
2. Copiez l'URI :
   ```
   mongodb+srv://admin-backend:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
3. Remplacez `<password>` par `Pass1234`
4. Ajoutez `/loterie-fdj` :
   ```
   mongodb+srv://admin-backend:Pass1234@cluster0.xxxxx.mongodb.net/loterie-fdj?retryWrites=true&w=majority
   ```

### Étape 3 : Mettre à jour Render

1. Dashboard Render → votre service → **Environment**
2. Trouvez `MONGODB_URI`
3. Cliquez sur l'icône ✏️ pour éditer
4. Collez le nouvel URI
5. **Save Changes**

Render va redémarrer automatiquement.

### Étape 4 : Vérifier les logs

Allez dans **Logs** et vérifiez :
```
✅ Connected to MongoDB
🚀 Server running on port 10000
```

## 📞 Besoin d'aide ?

Si ça ne marche toujours pas, donnez-moi :
1. Le message d'erreur exact des logs Render
2. Confirmation que Network Access = 0.0.0.0/0
3. Confirmation que l'utilisateur existe dans Database Access

---

**90% des problèmes sont résolus avec** : Network Access = `0.0.0.0/0` + mot de passe sans caractères spéciaux

