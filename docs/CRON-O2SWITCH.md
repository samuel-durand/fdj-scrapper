# 🕐 Tâches CRON sur o2switch - Guide complet

## 📋 Ce que tu dois savoir

### ✅ Ce qui fonctionne sur o2switch :
- Cron jobs PHP
- Cron jobs scripts shell Linux (bash)
- Téléchargement de fichiers via wget/curl
- Scripts simples de mise à jour

### ❌ Ce qui NE fonctionne PAS :
- Scripts `.bat` (Windows only)
- Node.js avec Puppeteer (besoin de Chrome)
- Installation de paquets système
- Processus longs (> 30 sec généralement limité)

---

## 🎯 SOLUTIONS RECOMMANDÉES

### **Solution 1 : Tâche planifiée Windows + Upload FTP automatique** ⭐ RECOMMANDÉ

**C'est la solution la plus simple et fiable !**

#### Pourquoi ?
- ✅ Puppeteer fonctionne parfaitement sur ton PC
- ✅ Pas de limitation de temps
- ✅ Upload automatique via WinSCP
- ✅ Déjà configuré avec tes scripts .bat

#### Comment faire ?

1. **Configure WinSCP** (déjà fait avec `upload-o2switch.txt`)

2. **Configure le Planificateur de tâches Windows** :

   **a. Ouvre le Planificateur** :
   ```
   Recherche Windows → "Planificateur de tâches"
   ```

   **b. Crée une nouvelle tâche** :
   - Clique droit → "Créer une tâche..."
   - Nom : `Loterie FDJ - Mise à jour o2switch`
   - Description : `Scrape les résultats et upload vers o2switch`

   **c. Déclencheur** :
   - Onglet "Déclencheurs" → Nouveau
   - Quotidien
   - Heure : **22:00** (après les tirages du soir)
   - Répéter : Chaque jour

   **d. Action** :
   - Onglet "Actions" → Nouveau
   - Action : Démarrer un programme
   - Programme : `C:\Users\sam\Documents\loterie\scripts\deployer-o2switch.bat`
   - Démarrer dans : `C:\Users\sam\Documents\loterie`

   **e. Conditions** :
   - ☑ Démarrer uniquement si l'ordinateur est relié au secteur
   - ☑ Réveiller l'ordinateur pour exécuter cette tâche
   - ☑ Démarrer uniquement si connecté au réseau

   **f. Paramètres** :
   - ☑ Autoriser l'exécution à la demande
   - ☑ Exécuter la tâche dès que possible si un démarrage planifié est manqué

3. **Teste** :
   - Clique droit sur ta tâche → "Exécuter"
   - Vérifie que ça fonctionne

4. **✅ Automatique !**
   - Tous les soirs à 22h
   - Scraping + Upload automatique
   - Ton PC peut être en veille (il se réveillera)

---

### **Solution 2 : Cron job PHP sur o2switch (Avancé)**

**Si tu veux vraiment que tout se passe sur o2switch :**

#### Limitations :
- ❌ Pas de Puppeteer (pas de Chrome)
- ✅ Mais peut télécharger depuis une API FDJ alternative

#### Étape 1 : Crée un script PHP `update-resultats.php`

```php
<?php
/**
 * Script cron pour mettre à jour les résultats sur o2switch
 * ATTENTION : Ne peut pas utiliser Puppeteer, utilise une API alternative
 */

// Configuration
$cacheFile = __DIR__ . '/resultats-cache.json';
$logFile = __DIR__ . '/cron-log.txt';

// Log de démarrage
file_put_contents($logFile, date('Y-m-d H:i:s') . " - Début de la mise à jour\n", FILE_APPEND);

// Option A : API FDJ alternative (si elle existe)
// Note : FDJ n'a pas d'API publique officielle, donc cette méthode est limitée

// Option B : Télécharger depuis ton propre serveur/GitHub
// Tu pourrais upload le cache sur GitHub et le télécharger ici

// Option C : Scraping simple avec PHP (très limité)
// Moins fiable que Puppeteer mais peut fonctionner

// Exemple avec file_get_contents (limité) :
try {
    // Tente de charger la page FDJ
    $url = 'https://www.fdj.fr/jeux-de-tirage/euromillions-my-million/resultats';
    
    $context = stream_context_create([
        'http' => [
            'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\n"
        ]
    ]);
    
    $html = file_get_contents($url, false, $context);
    
    if ($html === false) {
        throw new Exception("Impossible de charger la page");
    }
    
    // Parsing basique (très fragile, FDJ change souvent leur structure)
    // Note : Ceci est un EXEMPLE, il faudrait adapter selon la structure réelle
    
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - Succès\n", FILE_APPEND);
    
} catch (Exception $e) {
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - Erreur: " . $e->getMessage() . "\n", FILE_APPEND);
}

// Retourne un code de succès
http_response_code(200);
echo "OK";
?>
```

#### Étape 2 : Configure le cron job dans cPanel

1. **Connecte-toi à cPanel o2switch**

2. **Cherche "Tâches Cron"** ou "Cron Jobs"

3. **Ajoute une nouvelle tâche cron** :

   **Fréquence recommandée** : Tous les jours à 22h
   ```
   0 22 * * *
   ```

   **Commande** :
   ```bash
   /usr/bin/php /home/ton-user/www/update-resultats.php
   ```

   Ou avec wget :
   ```bash
   wget -O - -q https://ton-domaine.com/update-resultats.php >/dev/null 2>&1
   ```

4. **Sauvegarde**

#### ⚠️ Problème majeur :

Cette solution est **TRÈS LIMITÉE** car :
- FDJ n'a pas d'API publique
- Le scraping PHP est fragile (structure change souvent)
- Pas de Puppeteer = parsing HTML difficile
- Limitations de temps d'exécution

---

### **Solution 3 : GitHub Actions + Webhook** ⭐ ALTERNATIVE RECOMMANDÉE

**Si ton PC n'est pas toujours allumé, mais tu veux quand même de l'automatisation :**

#### Architecture :

```
GitHub Actions (gratuit)
  ↓ Tous les jours à 22h
  ↓ Exécute Node.js + Puppeteer
  ↓ Génère resultats-cache.json
  ↓ Upload vers o2switch via FTP
```

#### Avantages :
- ✅ Gratuit (2000 minutes/mois)
- ✅ Puppeteer fonctionne
- ✅ Automatique même si ton PC est éteint
- ✅ Logs et historique

#### Étape 1 : Crée `.github/workflows/update-fdj.yml`

```yaml
name: Mise à jour résultats FDJ

on:
  schedule:
    # Tous les jours à 22h UTC (ajuste selon ton fuseau horaire)
    - cron: '0 22 * * *'
  workflow_dispatch: # Permet l'exécution manuelle

jobs:
  scrape-and-upload:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install puppeteer
      
      - name: Scrape FDJ results
        run: node scraper-urls-directes.js 0.5
      
      - name: Upload to o2switch via FTP
        uses: SamKirkland/FTP-Deploy-Action@4.3.0
        with:
          server: ftp.ton-domaine.com
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          local-dir: ./
          server-dir: /www/
          include: |
            resultats-cache.json
```

#### Étape 2 : Configure les secrets GitHub

1. **Va sur ton repo GitHub**
2. **Settings → Secrets → Actions**
3. **Ajoute** :
   - `FTP_USERNAME` : ton user FTP o2switch
   - `FTP_PASSWORD` : ton mdp FTP o2switch

#### Étape 3 : Push vers GitHub

```bash
git add .github/workflows/update-fdj.yml
git commit -m "feat: GitHub Actions auto-update"
git push
```

#### ✅ C'est automatique !
- GitHub Actions s'exécute tous les jours à 22h
- Scrape avec Puppeteer
- Upload vers o2switch
- Même si ton PC est éteint !

---

## 📊 COMPARAISON DES SOLUTIONS

| Solution | Fiabilité | Complexité | Coût | PC requis |
|----------|-----------|------------|------|-----------|
| **Tâche planifiée Windows + WinSCP** | ⭐⭐⭐⭐⭐ | ⭐ Facile | Gratuit | Oui (veille OK) |
| **Cron PHP o2switch** | ⭐⭐ Fragile | ⭐⭐⭐⭐ Difficile | Gratuit | Non |
| **GitHub Actions** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ Moyen | Gratuit | Non |

---

## 🎯 MA RECOMMANDATION

### **Pour toi, la meilleure solution est :**

**Solution 1 : Tâche planifiée Windows**

**Pourquoi ?**
- ✅ Tu as déjà tout configuré (scripts .bat + WinSCP)
- ✅ Puppeteer fonctionne parfaitement
- ✅ Fiabilité maximale
- ✅ Logs visibles
- ✅ Ton PC peut être en veille (il se réveillera)

**Si ton PC est rarement allumé :**
→ Utilise **GitHub Actions** (Solution 3)

---

## 📋 SCRIPT D'AIDE : Configure la tâche planifiée

Je vais te créer un script qui configure automatiquement la tâche planifiée Windows !

```powershell
# Voir fichier : scripts/configurer-tache-planifiee.ps1
```

---

## 🆘 FAQ

### Q: Mon PC doit-il être allumé ?
**R:** Avec la tâche planifiée Windows, il peut être en **veille** (il se réveillera automatiquement). Mais il ne doit pas être complètement éteint. Si tu l'éteins souvent, utilise GitHub Actions.

### Q: Et si j'oublie d'allumer mon PC ?
**R:** La tâche planifiée a une option "Exécuter dès que possible si manqué" → elle s'exécutera au prochain démarrage.

### Q: Les cron jobs o2switch sont-ils gratuits ?
**R:** Oui, inclus dans ton hébergement o2switch !

### Q: GitHub Actions est-il vraiment gratuit ?
**R:** Oui, 2000 minutes/mois gratuites (largement suffisant pour 1 exécution/jour de 2-3 minutes).

---

## 🚀 PROCHAINES ÉTAPES

1. **Décide quelle solution tu préfères** :
   - Tâche Windows (PC en veille OK)
   - GitHub Actions (PC peut être éteint)

2. **Dis-moi ce que tu choisis** et je t'aide à configurer !

---

**Tu veux que je te fasse le script pour configurer la tâche planifiée Windows automatiquement ?** 😊

