# 🕐 Configuration CRON sur o2switch - Guide complet

## ⚠️ PRÉREQUIS : Puppeteer doit fonctionner !

**Avant de suivre ce guide, testez d'abord :**
```bash
node test-puppeteer-o2switch.js
```

✅ **Si le test réussit** → Suivez ce guide  
❌ **Si le test échoue** → Utilisez GitHub Actions à la place

---

## 🎯 Vue d'ensemble

Une fois Puppeteer fonctionnel sur o2switch, vous pouvez automatiser complètement :

```
Tâche CRON o2switch (tous les jours 22h30)
    ↓
Lance node cron-o2switch-scraper.js
    ↓
Scrape les résultats FDJ avec Puppeteer
    ↓
Génère resultats-cache.json
    ↓
Le site web charge automatiquement les nouveaux résultats
    ↓
✅ Site toujours à jour, 100% automatique !
```

---

## 📋 ÉTAPE 1 : Upload des fichiers

Via FileZilla ou cPanel Gestionnaire de fichiers, uploadez vers `/www/` :

```
/www/
├── cron-o2switch-scraper.js       ← Script cron (nouveau)
├── test-puppeteer-o2switch.js     ← Test (déjà uploadé)
├── scraper-urls-directes.js       ← Votre scraper
├── package.json                   ← Dépendances
├── resultats-cache.json           ← Sera généré automatiquement
└── node_modules/                  ← Après npm install
```

---

## 📦 ÉTAPE 2 : Installation des dépendances

### **Via terminal SSH ou terminal Node.js cPanel :**

```bash
# Se placer dans le bon dossier
cd ~/www

# Installer les dépendances (surtout Puppeteer)
npm install puppeteer

# Vérifier l'installation
ls -la node_modules/puppeteer

# Test rapide
node test-puppeteer-o2switch.js
```

**Résultat attendu :**
```
✅ Navigateur lancé avec succès !
✅ SUCCÈS ! Puppeteer fonctionne parfaitement sur o2switch !
```

---

## 🔧 ÉTAPE 3 : Rendre le script exécutable

```bash
# Donner les droits d'exécution
chmod +x cron-o2switch-scraper.js

# Tester le script manuellement
node cron-o2switch-scraper.js
```

**Résultat attendu :**
```
═══════════════════════════════════════════════════
🎰 CRON JOB O2SWITCH - Mise à jour résultats FDJ
═══════════════════════════════════════════════════
🚀 Démarrage du scraping automatique...
📊 Lancement du scraper...
✅ Scraping terminé avec succès
📁 Fichier généré : 0.15 MB
✅ Fichier valide et prêt
⏱️ Durée totale : 45.23 secondes
✅ Tâche cron terminée avec succès
═══════════════════════════════════════════════════
```

---

## ⏰ ÉTAPE 4 : Configuration du CRON job dans cPanel

### **A. Accéder aux tâches CRON**

1. **Connectez-vous à cPanel o2switch** : https://panel.o2switch.fr/

2. **Cherchez "Tâches Cron"** ou "Cron Jobs" dans la recherche

3. **Cliquez sur "Tâches Cron"**

### **B. Créer une nouvelle tâche CRON**

#### **1. Email de notification** (optionnel)

```
Email Cron : votre-email@gmail.com
```

Vous recevrez un email après chaque exécution (ou uniquement en cas d'erreur).

#### **2. Ajouter une nouvelle tâche Cron**

**Paramètres recommandés :**

**Commande :**
```bash
cd /home/VOTRE_USER/www && /usr/bin/node cron-o2switch-scraper.js >> cron-output.log 2>&1
```

Remplacez `VOTRE_USER` par votre vrai nom d'utilisateur cPanel.

**Fréquence : Tous les jours à 22h30**

Utilisez ces paramètres :

```
Minute :     30
Heure :      22
Jour :       *
Mois :       *
Jour semaine : *
```

Ou utilisez la syntaxe cron complète :
```
30 22 * * *
```

#### **3. Paramètres avancés**

**Exemples d'autres fréquences :**

```bash
# Tous les jours à 22h00
0 22 * * *

# Tous les jours à 21h30
30 21 * * *

# Mardi et vendredi à 22h (jours EuroMillions)
0 22 * * 2,5

# Toutes les 6 heures
0 */6 * * *

# Plusieurs fois par jour
0 12,18,22 * * *  # À midi, 18h et 22h
```

### **C. Sauvegarder**

Cliquez sur **"Ajouter une nouvelle tâche Cron"**

---

## ✅ ÉTAPE 5 : Vérification

### **A. Tester l'exécution manuelle**

Dans cPanel, vous pouvez généralement **tester** une tâche cron manuellement.

Ou via SSH :
```bash
cd ~/www
node cron-o2switch-scraper.js
```

### **B. Vérifier les logs**

Deux fichiers de logs sont créés :

**1. `cron-logs.txt`** - Logs détaillés de chaque exécution :
```bash
cat cron-logs.txt
```

Contenu :
```
[2025-10-24T22:30:01.234Z] ═══════════════════════════════════════════════════
[2025-10-24T22:30:01.235Z] 🎰 CRON JOB O2SWITCH - Mise à jour résultats FDJ
[2025-10-24T22:30:01.236Z] ═══════════════════════════════════════════════════
[2025-10-24T22:30:01.237Z] 🚀 Démarrage du scraping automatique...
[2025-10-24T22:30:45.123Z] ✅ Scraping terminé avec succès
[2025-10-24T22:30:45.124Z] 📁 Fichier généré : 0.15 MB
[2025-10-24T22:30:45.125Z] ✅ Tâche cron terminée avec succès
```

**2. `cron-output.log`** - Sortie brute du cron :
```bash
tail -f cron-output.log
```

### **C. Vérifier le résultat**

1. **Fichier généré :**
   ```bash
   ls -lh resultats-cache.json
   ```
   Devrait montrer un fichier récent (< 1 minute) de ~150 KB

2. **Sur votre site web :**
   ```
   https://votre-domaine.com
   ```
   Les résultats doivent être à jour !

---

## 📊 Monitoring et suivi

### **A. Email de notification**

Si vous avez configuré l'email, vous recevrez un message après chaque exécution :

**Sujet :** `Cron <VOTRE_USER@o2switch> cd /home/VOTRE_USER/www && ...`

**Contenu :**
- Sortie du script
- Erreurs éventuelles
- Durée d'exécution

### **B. Désactiver les emails (sauf erreurs)**

Si vous ne voulez des emails qu'en cas d'erreur :

```bash
# Modifiez la commande cron :
cd /home/VOTRE_USER/www && /usr/bin/node cron-o2switch-scraper.js >> cron-output.log 2>&1 || echo "Erreur lors du scraping"
```

### **C. Vérifier l'historique**

```bash
# Voir les 50 dernières lignes de logs
tail -50 cron-logs.txt

# Voir les exécutions réussies
grep "✅ Tâche cron terminée avec succès" cron-logs.txt

# Voir les erreurs
grep "❌" cron-logs.txt
```

---

## 🛠️ Optimisations

### **A. Nettoyer les vieux logs automatiquement**

Créez un second cron job pour nettoyer les logs tous les mois :

**Commande :**
```bash
cd /home/VOTRE_USER/www && echo "" > cron-logs.txt && echo "" > cron-output.log
```

**Fréquence :** Le 1er de chaque mois à minuit
```
0 0 1 * *
```

### **B. Scraper plus de données pendant la nuit**

Modifiez `cron-o2switch-scraper.js` pour scraper 3 mois au lieu de 0.5 :

```javascript
execSync(`node "${scraperPath}" 3`, { 
  cwd: __dirname,
  stdio: 'inherit'
});
```

### **C. Plusieurs scrapers à différents moments**

```bash
# Scraper rapide toutes les 6h (0.5 mois)
0 */6 * * * cd ~/www && node cron-o2switch-scraper.js

# Scraper complet 1x/semaine (3 mois) - Dimanche 3h du matin
0 3 * * 0 cd ~/www && node scraper-urls-directes.js 3
```

---

## 🔒 Sécurité

### **A. Permissions des fichiers**

```bash
# Scripts en lecture/exécution pour vous uniquement
chmod 700 cron-o2switch-scraper.js

# Fichier de cache en lecture pour tous
chmod 644 resultats-cache.json

# Logs en lecture/écriture pour vous uniquement
chmod 600 cron-logs.txt
```

### **B. Logs sensibles**

Les logs ne contiennent pas de données sensibles, mais si vous voulez :

```bash
# Créer un dossier logs/ caché
mkdir -p ~/logs
chmod 700 ~/logs

# Modifier le script pour utiliser ce dossier
const LOG_FILE = '/home/VOTRE_USER/logs/cron-logs.txt';
```

---

## 🆘 Dépannage

### **❌ Le cron ne s'exécute pas**

**Vérifications :**
1. Commande correcte dans cPanel
2. Chemin absolu vers Node.js : `/usr/bin/node` (ou `/usr/local/bin/node`)
3. Permissions d'exécution : `chmod +x cron-o2switch-scraper.js`

**Trouver le chemin de Node.js :**
```bash
which node
# Utilisez ce chemin dans la commande cron
```

### **❌ Erreur "node: command not found"**

**Solution :**
```bash
# Utilisez le chemin complet
cd /home/VOTRE_USER/www && /usr/local/bin/node cron-o2switch-scraper.js >> cron-output.log 2>&1
```

### **❌ Erreur "Cannot find module 'puppeteer'"**

**Solution :**
```bash
cd ~/www
npm install puppeteer
```

Vérifiez que `node_modules/` existe et contient puppeteer.

### **❌ Puppeteer échoue pendant le cron mais pas manuellement**

**Raison :** Variables d'environnement différentes

**Solution :**
```bash
# Ajoutez les variables nécessaires dans la commande cron
cd /home/VOTRE_USER/www && HOME=/home/VOTRE_USER /usr/bin/node cron-o2switch-scraper.js >> cron-output.log 2>&1
```

### **❌ Le fichier n'est pas généré**

**Vérifications :**
1. Vérifiez les logs : `cat cron-logs.txt`
2. Vérifiez les permissions d'écriture : `ls -la resultats-cache.json`
3. Testez manuellement : `node cron-o2switch-scraper.js`

---

## 📝 Checklist complète

### **Configuration initiale**
- [ ] Puppeteer testé et fonctionnel sur o2switch
- [ ] `cron-o2switch-scraper.js` uploadé
- [ ] `scraper-urls-directes.js` uploadé
- [ ] `package.json` uploadé
- [ ] `npm install puppeteer` exécuté
- [ ] Test manuel réussi : `node cron-o2switch-scraper.js`

### **Configuration du CRON**
- [ ] Tâche cron créée dans cPanel
- [ ] Fréquence configurée : `30 22 * * *`
- [ ] Commande correcte avec chemins absolus
- [ ] Email de notification configuré (optionnel)

### **Vérification**
- [ ] Premier test d'exécution réussi
- [ ] `cron-logs.txt` contient les logs
- [ ] `resultats-cache.json` est généré et à jour
- [ ] Site web affiche les nouveaux résultats
- [ ] Aucune erreur dans les logs

### **Monitoring**
- [ ] Logs vérifiés après la première exécution automatique
- [ ] Email de notification reçu et vérifié
- [ ] Taille du fichier cache vérifiée (~150 KB)

---

## 🎉 Résultat final

**Avec le CRON job configuré, vous avez maintenant :**

✅ **Scraping automatique** tous les soirs à 22h30  
✅ **100% automatisé** directement sur o2switch  
✅ **Aucun PC requis** - Tout se passe sur le serveur  
✅ **Logs détaillés** de chaque exécution  
✅ **Notifications email** en cas de problème  
✅ **Site toujours à jour** sans intervention  

**Configuration 100% serveur, 0% maintenance ! 🚀**

---

## 🆚 Comparaison avec GitHub Actions

| Critère | CRON o2switch | GitHub Actions |
|---------|---------------|----------------|
| **Localisation** | Sur votre serveur | Serveurs GitHub |
| **Nécessite Puppeteer sur o2switch** | ✅ Oui | ❌ Non |
| **Complexité** | ⭐⭐⭐ Moyen | ⭐⭐ Facile |
| **Upload FTP** | ❌ Non requis | ✅ Requis |
| **Gratuit** | ✅ Oui | ✅ Oui |
| **Fiabilité** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Minutes gratuites** | ♾️ Illimité | 2000/mois |

**Conclusion :** Si Puppeteer fonctionne sur o2switch, le CRON est excellent !  
Sinon, GitHub Actions est la meilleure alternative.

---

**Besoin d'aide ?** Consultez aussi :
- `test-puppeteer-o2switch.js` - Test de compatibilité
- `docs/GITHUB-ACTIONS-O2SWITCH.md` - Alternative GitHub Actions
- `README.md` - Documentation principale

