# 🚀 Guide de Déploiement

## 📦 Build réussi !

Ton projet a été compilé avec succès. Les fichiers de production se trouvent dans le dossier **`dist/`**.

## 📁 Contenu du dossier `dist/`

```
dist/
├── index.html              # Page HTML principale
└── assets/
    ├── index-v6bHj7iC.css  # Styles minifiés (~40 KB)
    └── index-6O0NNSbm.js   # JavaScript minifié (~184 KB)
```

## 🌐 Déploiement sur ton serveur

### Option 1 : Upload FTP/SFTP (Recommandé)

1. **Connecte-toi à ton serveur** (FileZilla, WinSCP, etc.)

2. **Upload TOUT le contenu du dossier `dist/`** vers le répertoire web de ton serveur :
   ```
   /var/www/html/          (Apache/Linux)
   ou
   /home/ton-user/public_html/   (cPanel)
   ou
   C:\inetpub\wwwroot\     (Windows/IIS)
   ```

3. **Structure finale sur le serveur** :
   ```
   ton-serveur/
   ├── index.html
   └── assets/
       ├── index-v6bHj7iC.css
       └── index-6O0NNSbm.js
   ```

4. **C'est tout !** Accède à ton site via ton domaine ou IP.

### Option 2 : Commande rapide (SCP)

Si tu as accès SSH à ton serveur :

```bash
# Exemple avec SCP
scp -r dist/* user@ton-serveur.com:/var/www/html/

# Exemple avec RSYNC
rsync -avz dist/ user@ton-serveur.com:/var/www/html/
```

### Option 3 : ZIP et Upload

```bash
# Créer un zip du dossier dist
Compress-Archive -Path dist\* -DestinationPath dist-production.zip

# Puis upload dist-production.zip sur ton serveur
# Décompresse-le dans le répertoire web
```

## 📋 Fichiers à copier (résumé)

✅ **À COPIER** :
- Tout le contenu du dossier `dist/`

❌ **NE PAS COPIER** :
- `node_modules/`
- `src/`
- `docs/`
- `scripts/`
- `utils/`
- `package.json`
- Fichiers `.bat`, `.js` de scraping
- `.git/`

## ⚙️ Configuration serveur

### Apache (.htaccess)

Si tu utilises Apache, crée un fichier `.htaccess` dans le dossier web :

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Cache Control
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
</IfModule>

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript
</IfModule>
```

### Nginx (nginx.conf)

```nginx
server {
    listen 80;
    server_name ton-domaine.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache des assets
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Compression
    gzip on;
    gzip_types text/css application/javascript;
}
```

## 🔄 Mise à jour du cache des résultats

**IMPORTANT** : Les résultats de loterie ne sont pas dans le build !

Le fichier `resultats-cache.json` doit être :
1. **Copié séparément** sur ton serveur
2. **Mis à jour régulièrement** avec les scrapers

### Solution 1 : Upload manuel
```bash
# Upload le cache après chaque scraping
scp resultats-cache.json user@serveur:/var/www/html/
```

### Solution 2 : API séparée
Configure un serveur backend qui :
- Exécute les scrapers
- Sert le `resultats-cache.json` via API
- L'app React le charge depuis cette API

## 📊 Vérification du déploiement

Après le déploiement, vérifie :

✅ La page charge correctement
✅ Les styles s'appliquent (CSS chargé)
✅ Les onglets fonctionnent
✅ Le thème sombre/clair fonctionne
✅ Les résultats s'affichent (si cache présent)

## 🐛 Problèmes courants

### Page blanche
- **Cause** : Chemins des assets incorrects
- **Solution** : Vérifie que `index.html` et le dossier `assets/` sont au même niveau

### CSS ne charge pas
- **Cause** : Mauvais chemin dans index.html
- **Solution** : Assure-toi que le chemin est relatif : `./assets/`

### Résultats ne s'affichent pas
- **Cause** : `resultats-cache.json` manquant
- **Solution** : Copie le fichier à la racine du serveur

### Erreur 404 sur rafraîchissement
- **Cause** : Serveur ne redirige pas vers index.html
- **Solution** : Configure `.htaccess` (Apache) ou `nginx.conf`

## 🔧 Rebuild après modifications

Si tu modifies le code :

```bash
# 1. Rebuild
npm run build

# 2. Upload le nouveau dist/
scp -r dist/* user@serveur:/var/www/html/

# Ou utilise le script
.\scripts\push-to-github.bat  # Optionnel : commit les changements
```

## 📝 Commandes utiles

```bash
# Build production
npm run build

# Preview du build en local (avant déploiement)
npm run preview

# Rebuild complet
rm -rf dist && npm run build
```

## 🌟 Optimisations supplémentaires

### 1. CDN
Utilise un CDN (Cloudflare, etc.) pour servir les assets plus rapidement.

### 2. Compression Brotli
Active la compression Brotli sur ton serveur pour des fichiers encore plus légers.

### 3. Cache serveur
Configure un cache serveur pour améliorer les performances.

## 📍 URLs importantes

Après déploiement, ton app sera accessible à :
- `http://ton-domaine.com`
- `http://ton-ip-serveur`

---

**🎉 Ton application est prête pour la production !**

Taille totale : ~225 KB (minifié + gzippé)
Performance : ⚡ Optimisé pour le web

