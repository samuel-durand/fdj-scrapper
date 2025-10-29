# 🔍 Test de connexion MongoDB sur O2Switch

## 📋 Prérequis

Assurez-vous d'avoir :
- ✅ Uploadé le dossier `backend/` sur O2Switch
- ✅ Créé le fichier `backend/.env` avec vos valeurs
- ✅ Installé les dépendances (`npm install`)

## 🧪 Test en local (pour vérifier que ça marche)

```bash
cd backend
npm run test-db
```

**Résultat attendu** :
```
✅ ✅ ✅ CONNEXION RÉUSSIE ! ✅ ✅ ✅
Host: fjd.c4zt5vn.mongodb.net
Database: fdj
🎉 MongoDB fonctionne correctement !
```

Si ça marche en local, passez au test sur O2Switch.

## 🌐 Test sur O2Switch (via SSH)

### 1. Connectez-vous en SSH

```bash
ssh votre-username@votre-domaine.o2switch.com
```

### 2. Allez dans le dossier backend

```bash
cd ~/public_html/backend
```

### 3. Vérifiez que .env existe

```bash
cat .env
```

Vous devriez voir :
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://fdj_db_user:...
JWT_SECRET=...
FRONTEND_URL=https://...
```

### 4. Lancez le test

```bash
npm run test-db
```

## 📊 Résultats possibles

### ✅ **Succès** :
```
✅ ✅ ✅ CONNEXION RÉUSSIE ! ✅ ✅ ✅
Host: fjd.c4zt5vn.mongodb.net
Database: fdj
```

➜ **Parfait !** Vous pouvez démarrer le serveur : `node server.js`

---

### ❌ **Erreur: "bad auth"**

```
❌ ERREUR DE CONNEXION
Type: MongoServerError
Message: Authentication failed
```

**Problème** : Username ou password incorrect

**Solutions** :
1. Vérifiez le fichier `.env` :
   ```bash
   cat .env | grep MONGODB_URI
   ```

2. Vérifiez sur MongoDB Atlas :
   - **Database Access** → Utilisateur `fdj_db_user` existe ?
   - Le mot de passe est correct ?

3. Re-créez un utilisateur avec un mot de passe simple (sans @#$%&) :
   - MongoDB Atlas → Database Access → Add New Database User
   - Username : `fdj_db_user`
   - Password : `Pass1234` (simple)
   - Update User

4. Mettez à jour `.env` avec le nouveau mot de passe

---

### ❌ **Erreur: "ENOTFOUND" ou "getaddrinfo"**

```
❌ ERREUR DE CONNEXION
Type: MongooseServerSelectionError
Message: getaddrinfo ENOTFOUND fjd.c4zt5vn.mongodb.net
```

**Problème** : Impossible de résoudre le nom de domaine MongoDB

**Solutions** :

1. **Testez la résolution DNS** :
   ```bash
   ping fjd.c4zt5vn.mongodb.net
   ```
   
   Si ça ne ping pas, problème DNS sur O2Switch.

2. **Vérifiez la connexion internet** :
   ```bash
   curl -I https://www.google.com
   ```

3. **Contactez O2Switch** si le serveur ne peut pas accéder à internet

---

### ❌ **Erreur: "ETIMEDOUT" ou "connect"**

```
❌ ERREUR DE CONNEXION
Type: MongooseServerSelectionError
Message: connect ETIMEDOUT
```

**Problème** : Connexion bloquée (firewall ou Network Access)

**Solutions** :

1. **MongoDB Atlas → Network Access** :
   - Vérifiez que `0.0.0.0/0` est dans la liste
   - Si absent, ajoutez-le :
     - Add IP Address
     - Allow Access from Anywhere
     - Confirm

2. **Vérifiez le firewall O2Switch** :
   ```bash
   # Testez une connexion sortante vers MongoDB
   telnet fjd.c4zt5vn.mongodb.net 27017
   ```
   
   Si ça ne répond pas, le firewall bloque.

3. **Contactez le support O2Switch** :
   - Demandez à débloquer les connexions sortantes vers MongoDB Atlas
   - Port 27017 (MongoDB)
   - Domaine : `*.mongodb.net`

---

### ⏱️ **Timeout après 30 secondes**

```
⏱️  TIMEOUT: La connexion prend trop de temps (>30s)
```

**Problème** : Firewall ou connexion très lente

**Solutions** :
1. Vérifiez que le serveur O2Switch peut faire des requêtes sortantes
2. Contactez le support O2Switch pour vérifier les restrictions réseau

---

## 🔐 MongoDB Atlas - Checklist complète

### Network Access
1. Allez sur https://cloud.mongodb.com
2. Menu → **Network Access**
3. Vérifiez qu'il y a : **`0.0.0.0/0`** (Allow Access from Anywhere)
4. Status : **Active**

### Database Access
1. Menu → **Database Access**
2. Utilisateur : **`fdj_db_user`**
3. Password : Défini et connu
4. Database User Privileges : **Read and write to any database**

### URI de connexion
```
mongodb+srv://fdj_db_user:PASSWORD@fjd.c4zt5vn.mongodb.net/fdj?retryWrites=true&w=majority&appName=fjd
```

Vérifiez :
- ✅ `mongodb+srv://` (pas `mongodb://`)
- ✅ Username correct : `fdj_db_user`
- ✅ Password correct (remplacé dans l'URI)
- ✅ Host : `fjd.c4zt5vn.mongodb.net`
- ✅ Database : `/fdj`
- ✅ Paramètres : `?retryWrites=true&w=majority&appName=fjd`

---

## 🆘 Si rien ne fonctionne

### Option 1 : Utiliser MongoDB local sur O2Switch

Si O2Switch bloque les connexions vers MongoDB Atlas, vous pouvez utiliser MongoDB en local :

1. Contactez le support O2Switch pour installer MongoDB
2. Changez `MONGODB_URI` dans `.env` :
   ```env
   MONGODB_URI=mongodb://localhost:27017/fdj
   ```

### Option 2 : Utiliser une autre base de données

O2Switch supporte aussi :
- MySQL/MariaDB (inclus dans l'hébergement)
- PostgreSQL (via cPanel)

---

## 📞 Contact Support

Si le problème persiste après tous ces tests :

**Support O2Switch** :
- Email : support@o2switch.fr
- Questions à poser :
  - "Les connexions sortantes vers MongoDB Atlas sont-elles autorisées ?"
  - "Le port 27017 est-il bloqué ?"
  - "Puis-je me connecter à *.mongodb.net ?"

**Donnez-leur** :
- L'erreur exacte du script de test
- Le résultat de `ping fjd.c4zt5vn.mongodb.net`
- Votre nom de domaine

---

## ✅ Une fois que ça marche

Quand le test réussit, démarrez le serveur :

```bash
cd ~/public_html/backend
node server.js
```

Ou avec PM2 (recommandé) :
```bash
pm2 start server.js --name "loterie"
pm2 save
pm2 startup
```

Testez l'API :
```bash
curl http://localhost:5000/api/health
```

Votre application sera accessible sur : `https://votre-domaine.com` 🎉

