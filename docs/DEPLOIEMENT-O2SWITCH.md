# 🌐 Déploiement sur o2switch

## ⚠️ Important : Comprendre o2switch

o2switch est un **hébergement mutualisé** avec des limitations :
- ✅ Apache + PHP (parfait pour ton app React compilée)
- ❌ Pas d'accès root
- ❌ Node.js limité ou absent
- ❌ Puppeteer ne fonctionnera PAS (besoin de Chrome)
- ❌ Pas de processus persistants

## 🎯 Solution recommandée

### **Architecture en 2 parties**

```
┌─────────────────────────────────────────────────────────────┐
│  TON PC (Local)                                             │
│  ├── Scrapers (Puppeteer)     → Récupère les données       │
│  └── Upload vers o2switch      → Envoie les résultats      │
└─────────────────────────────────────────────────────────────┘
                          ↓ Upload FTP/SSH
┌─────────────────────────────────────────────────────────────┐
│  O2SWITCH (Serveur)                                         │
│  ├── App React (fichiers dist/)                            │
│  └── resultats-cache.json     → Servi par Apache           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 ÉTAPE 1 : Déployer l'application sur o2switch

### A. Connexion FTP à o2switch

1. **Ouvre FileZilla** (ou WinSCP)

2. **Informations de connexion o2switch** :
   ```
   Hôte     : ftp.ton-domaine.com (ou IP fournie par o2switch)
   Port     : 21 (FTP) ou 22 (SFTP - recommandé)
   Utilisateur : ton-utilisateur-cpanel
   Mot de passe : ton-mot-de-passe
   ```

3. **Trouve le dossier web** :
   - Sur o2switch c'est généralement : `/home/ton-user/www/` ou `/public_html/`

### B. Upload des fichiers

1. **Ouvre le dossier `dist/` en local** (je l'ai ouvert pour toi)

2. **Upload TOUT le contenu** dans le dossier web d'o2switch :
   ```
   Local (dist/)              →    o2switch (/home/user/www/)
   ├── index.html             →    ├── index.html
   ├── resultats-cache.json   →    ├── resultats-cache.json
   ├── .htaccess              →    ├── .htaccess
   └── assets/                →    └── assets/
       ├── *.css              →        ├── *.css
       └── *.js               →        └── *.js
   ```

3. **✅ Ton site est en ligne !**
   - Accède à : `http://ton-domaine.com`

---

## 🔄 ÉTAPE 2 : Automatiser la mise à jour des résultats

### **Option A : Script Manuel (RECOMMANDÉ pour o2switch)**

Crée un fichier batch pour automatiser la mise à jour :

#### 1. Crée le script `update-et-upload.bat` :

```batch
@echo off
chcp 65001 > nul
echo.
echo ╔════════════════════════════════════════════╗
echo ║   🔄 MISE À JOUR ET UPLOAD O2SWITCH       ║
echo ╚════════════════════════════════════════════╝
echo.

REM 1. Scraper les résultats
echo 📊 Étape 1/3 : Scraping des résultats...
node scraper-urls-directes.js 0.5
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du scraping
    pause
    exit /b 1
)
echo ✅ Scraping terminé
echo.

REM 2. Copier dans dist
echo 📦 Étape 2/3 : Copie dans dist...
copy resultats-cache.json dist\ /Y
echo ✅ Fichier copié
echo.

REM 3. Upload FTP
echo 🌐 Étape 3/3 : Upload vers o2switch...
echo.
echo ⚠️  Maintenant, upload manuellement :
echo    1. Ouvre FileZilla
echo    2. Connecte-toi à o2switch
echo    3. Upload le fichier : dist\resultats-cache.json
echo    4. Destination : /home/ton-user/www/
echo.
echo Ou utilise WinSCP en mode ligne de commande (voir ci-dessous)
echo.

pause
```

#### 2. Utilise ce script :

```bash
# Double-clique sur update-et-upload.bat
# Ou exécute :
.\scripts\update-et-upload.bat
```

### **Option B : Automatisation complète avec WinSCP**

Si tu veux automatiser complètement l'upload FTP :

#### 1. Installe WinSCP
- Télécharge : https://winscp.net/

#### 2. Crée un script WinSCP `upload-o2switch.txt` :

```
open sftp://ton-user:ton-password@ftp.ton-domaine.com/
cd /home/ton-user/www/
put resultats-cache.json
exit
```

#### 3. Crée `auto-update-o2switch.bat` :

```batch
@echo off
echo 🔄 Scraping des résultats...
node scraper-urls-directes.js 0.5

echo 📦 Copie dans dist...
copy resultats-cache.json dist\ /Y

echo 🌐 Upload vers o2switch...
"C:\Program Files (x86)\WinSCP\WinSCP.com" /script=upload-o2switch.txt

echo ✅ Mise à jour terminée !
pause
```

### **Option C : Tâche planifiée Windows**

Pour automatiser complètement :

1. **Ouvre le Planificateur de tâches Windows**
   - Recherche : "Planificateur de tâches"

2. **Crée une nouvelle tâche** :
   - Nom : "Mise à jour loterie o2switch"
   - Déclencheur : Tous les jours à 22h (après les tirages)
   - Action : Lancer `auto-update-o2switch.bat`

3. **✅ Automatique !**
   - Les résultats se mettent à jour automatiquement
   - S'uploadent vers o2switch
   - Ton site est toujours à jour

---

## 🎯 ÉTAPE 3 : Alternative - Utiliser un sous-domaine pour l'API

Si tu veux séparer les données de l'app :

### Architecture avancée :

```
https://mon-site.com              → App React (statique)
https://api.mon-site.com/cache    → JSON des résultats

Avantages :
- App et données séparées
- Plus facile à mettre à jour
- Peut utiliser un autre serveur pour l'API
```

#### Configuration :

1. **Sur o2switch**, crée un sous-domaine `api` dans cPanel

2. **Upload seulement `resultats-cache.json`** dans `/api/`

3. **Modifie ton app React** pour charger depuis `https://api.ton-domaine.com/resultats-cache.json`

---

## 📅 Planning de mise à jour recommandé

### Quand mettre à jour les résultats ?

```
Lundi     21h30  → Scraper Loto + EuroDreams
Mardi     21h00  → Scraper EuroMillions
Mercredi  21h00  → Scraper Loto
Jeudi     21h30  → Scraper EuroDreams
Vendredi  21h00  → Scraper EuroMillions
Samedi    21h00  → Scraper Loto

Ou simplement :
- Tous les soirs à 22h00 (scrape tout)
```

### Script de planification :

```batch
REM Exécute tous les jours à 22h via le Planificateur Windows
@echo off
node scraper-urls-directes.js 0.1
copy resultats-cache.json dist\ /Y
"C:\Program Files (x86)\WinSCP\WinSCP.com" /script=upload-o2switch.txt
```

---

## ⚡ ÉTAPE 4 : Vérification sur o2switch

### A. Via cPanel (o2switch)

1. **Connecte-toi à cPanel** : https://panel.o2switch.fr/

2. **Gestionnaire de fichiers** :
   - Vérifie que tous les fichiers sont présents
   - Permissions recommandées :
     - Fichiers : 644
     - Dossiers : 755

3. **Vérifie .htaccess** :
   - Assure-toi que `.htaccess` est présent
   - S'il n'apparaît pas, active "Afficher les fichiers cachés"

### B. Test du site

1. **Accède à ton domaine** : `http://ton-domaine.com`

2. **Vérifie** :
   - ✅ Page charge
   - ✅ Styles s'appliquent
   - ✅ Onglets fonctionnent
   - ✅ Résultats s'affichent
   - ✅ Thème sombre/clair fonctionne

3. **Test mobile** :
   - Ouvre sur ton téléphone
   - Vérifie que le design est responsive

---

## 🔧 Configuration avancée o2switch

### A. Activer la compression (déjà dans .htaccess)

Le fichier `.htaccess` inclus active déjà :
- ✅ Compression Gzip
- ✅ Cache navigateur (1 an pour CSS/JS)
- ✅ Réécriture d'URL (pour React Router)

### B. SSL/HTTPS gratuit (Let's Encrypt)

1. **Dans cPanel o2switch**
2. **SSL/TLS** → **Let's Encrypt**
3. **Active SSL** pour ton domaine
4. **✅ Ton site sera en HTTPS !**

### C. Cache CloudFlare (optionnel)

Pour des performances encore meilleures :

1. Crée un compte CloudFlare (gratuit)
2. Ajoute ton domaine
3. Change les DNS chez o2switch
4. ✅ Site ultra-rapide partout dans le monde !

---

## 📊 Résumé des fichiers à créer

```
loterie/
├── scripts/
│   ├── update-et-upload.bat          ← Script de mise à jour
│   └── auto-update-o2switch.bat      ← Avec upload automatique
├── upload-o2switch.txt                ← Config WinSCP
└── dist/                              ← Déjà créé (à upload)
```

---

## 🎯 Checklist complète

### Déploiement initial

- [ ] Build l'app : `npm run build`
- [ ] Connecte-toi à o2switch via FTP
- [ ] Upload le contenu de `dist/` vers `/www/`
- [ ] Vérifie que le site fonctionne
- [ ] Active SSL dans cPanel

### Mise à jour quotidienne

- [ ] Lance le scraper : `npm run scrape-complet`
- [ ] Upload `resultats-cache.json` vers o2switch
- [ ] Vérifie sur le site que les résultats sont à jour

### Automatisation (optionnel)

- [ ] Installe WinSCP
- [ ] Crée le script `auto-update-o2switch.bat`
- [ ] Configure le Planificateur de tâches Windows
- [ ] Teste l'exécution automatique

---

## 💡 Astuces o2switch

### 1. Accès SSH (si disponible)

o2switch offre SSH sur certains forfaits :

```bash
ssh ton-user@ssh.ton-domaine.com

# Une fois connecté :
cd www
ls -la  # Voir les fichiers
```

### 2. Logs d'erreur

Dans cPanel → **Erreurs** :
- Vérifie les logs si quelque chose ne fonctionne pas

### 3. Statistiques

Dans cPanel → **AWStats** :
- Vois combien de visiteurs tu as

---

## 🆘 Support o2switch

Si problème :
- 📧 Email : support@o2switch.fr
- 💬 Chat en direct sur panel.o2switch.fr
- 📱 Téléphone : Disponible dans cPanel

---

## 🎉 Résumé pour o2switch

**Ce qui fonctionne :**
✅ App React (fichiers statiques)
✅ Hébergement des résultats JSON
✅ SSL gratuit
✅ Performances excellentes

**Ce qui ne fonctionne PAS directement :**
❌ Scrapers Puppeteer (à faire en local)
❌ Serveur Node.js persistant (pas nécessaire)
❌ Cron jobs Node.js (utilise le Planificateur Windows)

**Solution idéale :**
🎯 App hébergée sur o2switch
🎯 Scraping fait sur ton PC
🎯 Upload automatique via FTP/WinSCP
🎯 Tâche planifiée Windows pour automatiser

---

**Ton site sera en ligne 24/7 sur o2switch, et les résultats se mettront à jour automatiquement depuis ton PC !** 🚀

