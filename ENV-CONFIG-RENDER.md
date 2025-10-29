# Configuration des Variables d'Environnement pour Render

## Variables à configurer sur Render

Allez dans **Dashboard** → **Environment** et ajoutez les variables suivantes :

### Variables obligatoires :

| Variable | Valeur exemple | Description |
|----------|----------------|-------------|
| `NODE_ENV` | `production` | Mode de production |
| `PORT` | `10000` | Port du serveur (Render l'assigne automatiquement) |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/loterie-fdj` | URI de connexion MongoDB Atlas |
| `JWT_SECRET` | `votre_secret_jwt_tres_securise_32_caracteres_minimum` | Clé secrète pour les JWT (générer une clé aléatoire) |
| `FRONTEND_URL` | `https://votre-domaine.o2switch.com` | URL de votre frontend sur O2Switch |

## Étapes de configuration sur Render

1. **Créer un nouveau Web Service**
   - Connectez votre repository GitHub
   - Sélectionnez la branche **`backend`**

2. **Configuration Build & Deploy**
   ```
   Build Command: npm install
   Start Command: node server.js
   ```

3. **Ajouter les variables d'environnement**
   - Allez dans l'onglet "Environment"
   - Cliquez sur "Add Environment Variable"
   - Ajoutez toutes les variables listées ci-dessus

4. **Configurer MongoDB Atlas**
   - Créez un cluster gratuit sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Créez un utilisateur de base de données
   - Ajoutez `0.0.0.0/0` dans Network Access pour autoriser Render
   - Copiez l'URI de connexion dans `MONGODB_URI`

5. **Générer un JWT Secret sécurisé**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

## Test de déploiement

Une fois déployé, testez votre API :
```
https://votre-service.onrender.com/api/health
```

Vous devriez recevoir :
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

## Configuration CORS

Le backend est configuré pour accepter les requêtes depuis l'URL spécifiée dans `FRONTEND_URL`. Assurez-vous que cette URL correspond exactement à votre domaine O2Switch (avec ou sans trailing slash, selon votre configuration).

## Notes importantes

⚠️ **Attention :** Render peut mettre votre service en veille après 15 minutes d'inactivité (plan gratuit). Le premier appel après la veille peut prendre 30-60 secondes.

💡 **Astuce :** Utilisez un service comme UptimeRobot pour ping votre API toutes les 5-10 minutes et éviter la mise en veille.

