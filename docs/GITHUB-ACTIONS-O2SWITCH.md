# 🤖 Automatisation COMPLÈTE avec GitHub Actions

## 🎯 Pourquoi GitHub Actions ?

**Avantages majeurs :**
- ✅ **Gratuit** (2000 minutes/mois)
- ✅ **Puppeteer fonctionne** (Chrome inclus)
- ✅ **Automatique 24/7** (même PC éteint)
- ✅ **Upload automatique** vers o2switch
- ✅ **Logs et historique** de chaque exécution
- ✅ **Exécution manuelle** possible

---

## 📋 Configuration en 5 minutes

### **Étape 1 : Pusher le workflow vers GitHub**

Les fichiers sont déjà créés :
- `.github/workflows/update-fdj.yml` ✅

```bash
# Ajouter les fichiers
git add .github/workflows/update-fdj.yml
git add test-puppeteer-o2switch.js
git commit -m "feat: GitHub Actions automatisation"
git push
```

### **Étape 2 : Configurer les secrets o2switch**

1. **Allez sur votre repo GitHub** :
   ```
   https://github.com/VOTRE_USERNAME/VOTRE_REPO
   ```

2. **Cliquez sur "Settings"** (⚙️ en haut à droite)

3. **Dans le menu gauche** : 
   - Secrets and variables → Actions

4. **Cliquez "New repository secret"**

5. **Ajoutez 3 secrets** :

   **Secret 1 : FTP_SERVER**
   ```
   Name:  FTP_SERVER
   Value: ftp.votre-domaine.com
   ```
   (ou l'IP fournie par o2switch, ex: `ftp.cluster123.hosting.ovh.net`)

   **Secret 2 : FTP_USERNAME**
   ```
   Name:  FTP_USERNAME
   Value: votre-user-cpanel
   ```

   **Secret 3 : FTP_PASSWORD**
   ```
   Name:  FTP_PASSWORD
   Value: votre-mot-de-passe-cpanel
   ```

6. **✅ Sauvegardez** chaque secret

### **Étape 3 : Tester l'exécution**

1. **Allez dans l'onglet "Actions"** de votre repo

2. **Cliquez sur le workflow** :
   ```
   🎰 Mise à jour automatique FDJ → o2switch
   ```

3. **Cliquez "Run workflow"** (bouton à droite)
   - Branch: main
   - Cliquez "Run workflow"

4. **Suivez l'exécution en temps réel** (2-3 minutes)

5. **Résultat attendu** :
   ```
   ✅ Récupération du code
   ✅ Installation de Node.js
   ✅ Installation des dépendances
   ✅ Scraping des résultats FDJ
   ✅ Upload vers o2switch via FTP
   ✅ Résumé
   ```

### **Étape 4 : Vérifier sur votre site**

Accédez à : `https://votre-domaine.com`

Les résultats doivent être à jour ! 🎉

---

## ⏰ Planning automatique

Le workflow s'exécute **automatiquement** :

```yaml
schedule:
  - cron: '30 22 * * *'  # Tous les jours à 22h30 UTC
```

**Pour la France (UTC+1 en hiver, UTC+2 en été) :**
- Hiver : 23h30 heure française
- Été : 00h30 heure française (minuit et demi)

### **Modifier l'horaire :**

Éditez `.github/workflows/update-fdj.yml` :

```yaml
# Pour 21h30 UTC (22h30 FR hiver) :
- cron: '30 21 * * *'

# Pour 22h00 UTC (23h00 FR hiver) :
- cron: '0 22 * * *'
```

**Format cron :**
```
┌───────────── minute (0 - 59)
│ ┌───────────── heure (0 - 23)
│ │ ┌───────────── jour du mois (1 - 31)
│ │ │ ┌───────────── mois (1 - 12)
│ │ │ │ ┌───────────── jour de la semaine (0 - 6) (0 = dimanche)
│ │ │ │ │
* * * * *
```

**Exemples :**
```yaml
- cron: '0 22 * * *'      # Tous les jours à 22h
- cron: '30 21 * * 2,5'   # Mardi et vendredi à 21h30
- cron: '0 */6 * * *'     # Toutes les 6 heures
```

---

## 🔍 Suivre les exécutions

### **Via l'interface GitHub**

1. **Onglet "Actions"** de votre repo
2. **Historique** de toutes les exécutions
3. **Cliquez** sur une exécution pour voir les logs détaillés

### **Recevoir des notifications**

**En cas d'échec**, GitHub vous envoie un email automatiquement !

Pour configurer :
1. GitHub → Settings → Notifications
2. ✅ Actions → Email notifications

---

## 🛠️ Options avancées

### **A. Exécution multiple par jour**

Pour scraper plusieurs fois par jour :

```yaml
schedule:
  - cron: '0 12 * * *'   # Midi
  - cron: '0 18 * * *'   # 18h
  - cron: '30 22 * * *'  # 22h30
```

### **B. Scraper seulement certains jours**

```yaml
# Seulement mardi (2) et vendredi (5) pour EuroMillions
- cron: '30 21 * * 2,5'

# Seulement lundi, mercredi, samedi pour Loto
- cron: '30 20 * * 1,3,6'
```

### **C. Build complet avec upload de dist/**

Ajoutez une étape de build :

```yaml
- name: 🏗️ Build de l'application
  run: npm run build

- name: 🌐 Upload dist/ vers o2switch
  uses: SamKirkland/FTP-Deploy-Action@v4.3.5
  with:
    server: ${{ secrets.FTP_SERVER }}
    username: ${{ secrets.FTP_USERNAME }}
    password: ${{ secrets.FTP_PASSWORD }}
    local-dir: ./dist/
    server-dir: /www/
```

### **D. Cache npm pour aller plus vite**

Déjà inclus avec :
```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
```

Les dépendances sont mises en cache entre les exécutions !

---

## 📊 Comparaison des solutions

| Solution | PC requis | Fiabilité | Gratuit | Complexité |
|----------|-----------|-----------|---------|------------|
| **GitHub Actions** | ❌ Non | ⭐⭐⭐⭐⭐ | ✅ Oui | ⭐⭐ Facile |
| **Tâche Windows** | ✅ Oui (veille OK) | ⭐⭐⭐⭐⭐ | ✅ Oui | ⭐ Très facile |
| **Node.js o2switch** | ❌ Non | ⭐⭐ Fragile | ✅ Oui | ⭐⭐⭐⭐ Difficile |

---

## ❓ FAQ

### **Q: C'est vraiment gratuit ?**
**R:** Oui ! GitHub offre 2000 minutes/mois gratuites. Votre workflow prend ~2-3 min/jour = 90 min/mois. Largement dans les limites.

### **Q: Et si je dépasse les 2000 minutes ?**
**R:** Impossible avec 1 exécution/jour. Même avec 3 exécutions/jour, vous n'utiliseriez que ~270 min/mois.

### **Q: Mes identifiants FTP sont-ils sécurisés ?**
**R:** OUI ! Les secrets GitHub sont chiffrés et jamais affichés dans les logs.

### **Q: Puis-je désactiver temporairement ?**
**R:** Oui, dans `.github/workflows/update-fdj.yml`, commentez la section schedule :
```yaml
# schedule:
#   - cron: '30 22 * * *'
```

### **Q: Comment voir les logs ?**
**R:** GitHub → Actions → Cliquez sur une exécution → Logs détaillés

### **Q: Puis-je scraper plus de données ?**
**R:** Oui ! Modifiez le script :
```yaml
- name: 🎯 Scraping des résultats FDJ
  run: node scraper-urls-directes.js 3  # 3 mois au lieu de 0.5
```

### **Q: Et si o2switch change mes identifiants FTP ?**
**R:** Mettez à jour le secret dans GitHub Settings → Secrets → Actions

---

## 🎉 Résultat final

**Avec GitHub Actions, vous avez maintenant :**

✅ **Scraping automatique** tous les soirs à 22h30  
✅ **Upload automatique** vers o2switch  
✅ **Site toujours à jour** sans intervention  
✅ **Logs complets** de chaque exécution  
✅ **Notifications** en cas de problème  
✅ **Gratuit** à vie  
✅ **Fonctionne 24/7** même PC éteint  

**Plus aucune action manuelle requise ! 🚀**

---

## 🆘 Dépannage

### **❌ Erreur "FTP connection failed"**

**Vérifications :**
1. Secrets bien configurés (pas d'espaces)
2. Server = `ftp.votre-domaine.com` (sans `https://`)
3. Username = votre user cPanel exact
4. Password = mot de passe correct

**Solution :**
- Testez vos identifiants avec FileZilla d'abord
- Vérifiez que le FTP est activé dans cPanel o2switch

### **❌ Erreur "Puppeteer failed to launch"**

GitHub Actions inclut Chrome, cette erreur ne devrait PAS arriver.

Si elle arrive quand même :
```yaml
- name: 📦 Installation de Chrome (si besoin)
  run: |
    sudo apt-get update
    sudo apt-get install -y chromium-browser
```

### **❌ Le fichier n'est pas uploadé**

**Vérifications :**
1. `server-dir: /www/` est correct pour o2switch
2. Le fichier `resultats-cache.json` est bien généré
3. L'exclusion ne bloque pas le fichier

**Solution :**
Simplifiez l'upload en uploadant seulement le JSON :
```yaml
local-dir: ./
server-dir: /www/
exclude: |
  **/*
  !resultats-cache.json
```

---

## 📝 Checklist de mise en route

- [ ] Workflow créé : `.github/workflows/update-fdj.yml`
- [ ] Poussé vers GitHub : `git push`
- [ ] Secret `FTP_SERVER` configuré
- [ ] Secret `FTP_USERNAME` configuré
- [ ] Secret `FTP_PASSWORD` configuré
- [ ] Test manuel effectué (Run workflow)
- [ ] Vérification sur le site web
- [ ] Horaire ajusté selon vos besoins

**✅ Tout coché ? Félicitations, c'est automatisé ! 🎊**

---

**Besoin d'aide ?** Consultez aussi :
- [Documentation GitHub Actions](https://docs.github.com/en/actions)
- [Support o2switch](https://www.o2switch.fr/support)
- `README.md` - Documentation principale

