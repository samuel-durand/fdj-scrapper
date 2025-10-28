# 🚀 Déploiement IMMÉDIAT sur ton serveur o2switch

Tu as déjà un serveur o2switch ? Parfait ! Voici comment déployer en **10 minutes** ! ⚡

---

## ✅ ÉTAPE 1 : Build de production (2 min)

Le dossier `dist/` est **déjà créé** ! ✅

Si tu veux re-builder :
```bash
npm run build
```

**Contenu du dossier `dist/` à upload :**
```
dist/
├── index.html
├── resultats-cache.json
├── .htaccess
└── assets/
    ├── index-[hash].js
    ├── index-[hash].css
    └── ...
```

---

## 📤 ÉTAPE 2 : Upload vers ton o2switch (5 min)

### **Option A - FileZilla (Interface graphique - RECOMMANDÉ)**

1. **Ouvre FileZilla**
   - Si pas installé : https://filezilla-project.org/

2. **Connecte-toi à ton o2switch :**
   ```
   Hôte :     ftp.ton-domaine.com  (ou l'IP fournie par o2switch)
   Port :     21 (FTP) ou 22 (SFTP - plus sécurisé)
   Utilisateur : _________ (ton user cPanel)
   Mot de passe : _________ (ton mdp cPanel)
   ```

3. **Navigue vers le dossier web :**
   - Côté distant (o2switch) : `/www/` ou `/public_html/`
   - Côté local (ton PC) : `C:\Users\sam\Documents\loterie\dist\`

4. **Upload TOUT le contenu de `dist/` :**
   - Sélectionne TOUS les fichiers dans `dist/`
   - Glisse-dépose vers `/www/`
   - Attends la fin du transfert

5. **✅ Ton site est en ligne !**
   - Accède à : `http://ton-domaine.com`

### **Option B - WinSCP (Alternative)**

1. **Ouvre WinSCP**
   - Si pas installé : https://winscp.net/

2. **Nouvelle session :**
   ```
   Protocole : SFTP
   Serveur : ftp.ton-domaine.com
   Port : 22
   Utilisateur : ton-user
   Mot de passe : ton-mdp
   ```

3. **Upload le dossier `dist/` vers `/www/`**

4. **✅ Fait !**

### **Option C - Via cPanel (Gestionnaire de fichiers)**

1. **Connecte-toi à cPanel :**
   - `https://panel.o2switch.fr/`
   - Identifiants o2switch

2. **Gestionnaire de fichiers :**
   - Ouvre le dossier `/www/` ou `/public_html/`

3. **Upload :**
   - Clique "Envoyer" en haut
   - Sélectionne les fichiers de `dist/`
   - Attends la fin du transfert

4. **✅ En ligne !**

---

## 🔐 ÉTAPE 3 : Active HTTPS (SSL gratuit) - 2 min

1. **Dans cPanel o2switch** : https://panel.o2switch.fr/

2. **Cherche "SSL/TLS"** ou "Let's Encrypt"

3. **Sélectionne ton domaine**

4. **Active SSL gratuit**

5. **✅ Ton site sera en HTTPS !**
   - `https://ton-domaine.com` 🔒

---

## 🎯 ÉTAPE 4 : Configure l'auto-update (3 min)

Maintenant, il faut mettre à jour les résultats quotidiennement depuis ton PC.

### **Personnalise le script WinSCP :**

1. **Ouvre le fichier** : `upload-o2switch.txt`

2. **Remplace par tes vraies informations :**
   ```
   # Avant :
   open sftp://TON_USER:TON_PASSWORD@ftp.ton-domaine.com/
   cd /home/TON_USER/www/

   # Après (exemple) :
   open sftp://sam123:MonMotDePasse@ftp.mon-site.com/
   cd /home/sam123/www/
   ```

3. **Sauvegarde**

### **Teste l'upload automatique :**

```bash
# Lance le script
.\scripts\auto-update-o2switch.bat
```

Si ça fonctionne, tu verras :
```
✅ Scraping terminé
✅ Fichier copié
✅ Upload terminé
🌐 Ton site est maintenant à jour sur o2switch
```

---

## 🤖 ÉTAPE 5 : Automatise avec Windows (5 min)

Pour que les résultats se mettent à jour **automatiquement tous les jours** :

### **A. Ouvre le Planificateur de tâches Windows**

1. **Recherche Windows** : `Planificateur de tâches`
2. **Clique droit** sur "Bibliothèque du Planificateur de tâches"
3. **"Créer une tâche..."**

### **B. Configure la tâche**

**Onglet "Général" :**
- Nom : `Mise à jour loterie o2switch`
- Description : `Scrape les résultats FDJ et upload vers o2switch`
- ☑ Exécuter même si l'utilisateur n'est pas connecté
- Configurer pour : Windows 10

**Onglet "Déclencheurs" :**
- Nouveau...
- Quotidien
- Heure : `22:00` (après les tirages)
- Répéter chaque : `1 jour`

**Onglet "Actions" :**
- Nouveau...
- Action : Démarrer un programme
- Programme : `C:\Users\sam\Documents\loterie\scripts\auto-update-o2switch.bat`
- Démarrer dans : `C:\Users\sam\Documents\loterie`

**Onglet "Conditions" :**
- ☑ Démarrer uniquement si l'ordinateur est relié au secteur
- ☑ Démarrer uniquement si la connexion réseau suivante est disponible : N'importe quelle connexion

**Onglet "Paramètres" :**
- ☑ Autoriser l'exécution de la tâche à la demande
- ☑ Exécuter la tâche dès que possible si un démarrage planifié est manqué

### **C. Teste la tâche**

1. **Clique droit** sur ta tâche
2. **"Exécuter"**
3. **Vérifie** que ça fonctionne

### **✅ C'est fait !**

Maintenant :
- Tous les soirs à 22h
- Ton PC scrape automatiquement
- Upload vers o2switch
- Ton site est toujours à jour ! 🎉

---

## 🔍 VÉRIFICATION FINALE

### **1. Vérifie ton site web**

Accède à : `http://ton-domaine.com` (ou `https://` si SSL activé)

**Checklist :**
- ✅ Page charge correctement
- ✅ Design s'affiche bien
- ✅ 3 onglets fonctionnent (EuroMillions, Loto, EuroDreams)
- ✅ Résultats s'affichent
- ✅ Thème sombre/clair fonctionne
- ✅ Calendrier fonctionne
- ✅ Modal "Voir détails" fonctionne
- ✅ Responsive sur mobile

### **2. Vérifie les fichiers sur o2switch**

**Via cPanel → Gestionnaire de fichiers** :

Dossier `/www/` doit contenir :
```
/www/
├── index.html               ✅
├── resultats-cache.json     ✅
├── .htaccess                ✅ (fichier caché, active "Afficher fichiers cachés")
└── assets/
    ├── index-[hash].css     ✅
    ├── index-[hash].js      ✅
    └── ...
```

**Permissions correctes :**
- Fichiers : `644` (lecture pour tous, écriture pour toi)
- Dossiers : `755` (exécution pour tous)

### **3. Vérifie l'auto-update**

```bash
# Test manuel
.\scripts\auto-update-o2switch.bat

# Si ça fonctionne :
# 1. Les résultats sont scrapés
# 2. Le fichier est uploadé
# 3. Ton site web montre les nouveaux résultats
```

---

## 🎯 RÉCAPITULATIF - Ce que tu as maintenant

### **Sur o2switch (24/7 en ligne) :**
- ✅ Application React compilée
- ✅ Données JSON (`resultats-cache.json`)
- ✅ SSL/HTTPS gratuit
- ✅ Compression et cache activés
- ✅ Site accessible au monde entier

### **Sur ton PC (automatisation) :**
- ✅ Scraper Puppeteer
- ✅ Upload automatique WinSCP
- ✅ Tâche planifiée Windows (22h tous les jours)

### **Workflow quotidien automatique :**
```
22h00 → PC scrape FDJ
22h01 → Upload vers o2switch
22h02 → Site à jour automatiquement
       ⬇
    Aucune action requise ! 🎉
```

---

## 📊 STATISTIQUES ET MONITORING

### **Via cPanel o2switch :**

1. **AWStats** - Statistiques de visites
   - Nombre de visiteurs
   - Pages vues
   - Pays d'origine

2. **Logs d'erreur**
   - Si un problème survient
   - Accès : cPanel → Erreurs

3. **Utilisation des ressources**
   - Bande passante
   - Espace disque

---

## ⚡ RACCOURCIS UTILES

### **Mise à jour manuelle rapide :**
```bash
# Double-clique simplement :
scripts\update-et-upload.bat

# Puis upload resultats-cache.json via FileZilla
```

### **Scraper seulement un jeu :**
```bash
# EuroDreams uniquement
npm run scrape-eurodreams

# Les 3 jeux (complet)
npm run scrape-complet
```

### **Nettoyer le cache local :**
```bash
npm run nettoyer-cache
```

---

## 🆘 DÉPANNAGE

### **❌ Le site ne s'affiche pas**

**Vérifications :**
1. Fichiers uploadés dans `/www/` (pas dans un sous-dossier)
2. `index.html` présent à la racine
3. Permissions correctes (644 pour fichiers, 755 pour dossiers)
4. Vide le cache du navigateur (Ctrl + F5)

**Solution :**
```bash
# Re-upload tout
npm run build
# Puis upload complet via FileZilla
```

### **❌ CSS/JS ne chargent pas**

**Vérifications :**
1. Dossier `assets/` présent
2. `.htaccess` présent (affiche fichiers cachés)

**Solution :**
```bash
# Dans cPanel, vérifie le .htaccess
# S'il manque, upload-le depuis dist/.htaccess
```

### **❌ Auto-update ne fonctionne pas**

**Vérifications :**
1. WinSCP installé : `C:\Program Files (x86)\WinSCP\WinSCP.com`
2. Identifiants corrects dans `upload-o2switch.txt`
3. Connexion Internet active

**Test manuel :**
```bash
# Lance juste le scraper
node scraper-urls-directes.js 0.1

# Upload manuellement via FileZilla
```

### **❌ Les résultats ne s'affichent pas**

**Vérifications :**
1. `resultats-cache.json` uploadé sur o2switch
2. Fichier non vide (> 100 Ko)
3. Format JSON valide

**Solution :**
```bash
# Re-scrape
npm run scrape-complet

# Upload resultats-cache.json
```

---

## 💡 OPTIMISATIONS AVANCÉES (Optionnel)

### **1. CloudFlare (CDN gratuit)**

Pour un site ultra-rapide partout dans le monde :

1. Crée un compte CloudFlare (gratuit)
2. Ajoute ton domaine
3. Change les DNS chez o2switch
4. Active le mode "Proxy" (orange)
5. ✅ Site 10x plus rapide !

### **2. Sous-domaine pour l'API**

Si tu veux séparer l'app et les données :

```
https://mon-site.com              → App React
https://api.mon-site.com/cache    → JSON des résultats
```

**Avantages :**
- Plus facile à mettre à jour
- Peut utiliser un autre serveur pour l'API
- Meilleure organisation

**Configuration :**
1. Crée un sous-domaine `api` dans cPanel
2. Upload seulement `resultats-cache.json` dans `/api/`
3. Modifie `src/services/lotteryService.js` pour charger depuis `api.ton-domaine.com`

### **3. Compression Brotli (meilleure que Gzip)**

Si ton o2switch le supporte :

Dans `.htaccess`, ajoute :
```apache
<IfModule mod_brotli.c>
    AddOutputFilterByType BROTLI_COMPRESS text/html text/css application/javascript
</IfModule>
```

---

## 📞 SUPPORT O2SWITCH

Si tu as un problème technique :

- 📧 **Email** : support@o2switch.fr
- 💬 **Chat** : https://panel.o2switch.fr/ (en bas à droite)
- 📱 **Téléphone** : Disponible dans ton cPanel
- ⏰ **Horaires** : 7j/7 (excellent support !)

---

## 🎉 FÉLICITATIONS !

**Ton site de loterie est maintenant :**
- ✅ En ligne 24/7 sur o2switch
- ✅ Avec HTTPS sécurisé
- ✅ Mis à jour automatiquement tous les jours
- ✅ Accessible depuis n'importe où dans le monde
- ✅ Rapide et optimisé
- ✅ Professionnel et fiable

**Tu peux partager l'URL avec qui tu veux ! 🚀**

---

## 📝 CHECKLIST FINALE

Avant de fermer ce guide :

- [ ] Site déployé sur o2switch
- [ ] SSL/HTTPS activé
- [ ] `upload-o2switch.txt` configuré avec tes identifiants
- [ ] `auto-update-o2switch.bat` testé et fonctionnel
- [ ] Tâche planifiée Windows créée (22h tous les jours)
- [ ] Test complet du site (mobile + desktop)
- [ ] Résultats s'affichent correctement
- [ ] Premier test d'auto-update réussi

**✅ Tout est coché ? Bravo, c'est fini ! 🎊**

---

**Besoin d'aide ?** Consulte aussi :
- `docs/DEPLOIEMENT-O2SWITCH.md` - Guide détaillé
- `docs/DEMARRAGE_RAPIDE.md` - Démarrage rapide
- `README.md` - Documentation principale

---

**🎰 Profite bien de ton site de résultats de loterie ! 🍀**

