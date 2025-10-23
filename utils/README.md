# 🛠️ Scripts Utilitaires

Ce dossier contient les scripts utilitaires et les anciens scrapers pour la maintenance et les tâches spécifiques.

## 🔧 Scripts de maintenance

### Correction et nettoyage
- **`fix-eurodreams-jackpot.js`** - Corrige les jackpots EuroDreams erronés dans le cache
  ```bash
  node utils/fix-eurodreams-jackpot.js
  ```
  Normalise tous les jackpots EuroDreams à "20 000 € par mois"

- **`nettoyer-cache.js`** - Nettoie le cache des données invalides
  ```bash
  node utils/nettoyer-cache.js
  ```
  Supprime les tirages avec des données incomplètes

### Mise à jour
- **`update-cache-3-mois.js`** - Met à jour le cache avec 3 mois de résultats
  ```bash
  node utils/update-cache-3-mois.js
  ```

## 📜 Anciens scrapers (obsolètes)

Ces scrapers sont conservés pour référence mais ne sont plus utilisés :

### ⚠️ Obsolètes
- **`scraper-fdj.js`** - Premier scraper avec node-fetch et cheerio
  - **Problème** : Données incomplètes, parsing HTML instable
  - **Remplacé par** : scraper-puppeteer.js

- **`scraper-3-mois.js`** - Scraper des 3 derniers mois (ancienne version)
  - **Problème** : Méthode de navigation pas fiable
  - **Remplacé par** : scraper-urls-directes.js

- **`scraper-historique-puppeteer.js`** - Tentative de scraping par navigation
  - **Problème** : FDJ n'a pas de boutons "précédent" utilisables
  - **Remplacé par** : scraper-urls-directes.js (URLs directes)

## 📊 Données de référence

- **`year-data-2025.js`** - Données de fallback pour 2025
  - Utilisé comme données de secours si le scraping échoue
  - Format JSON avec résultats de test

## 🎯 Scrapers actuels (à la racine)

Les scrapers actifs sont à la racine du projet :
- **`scraper-urls-directes.js`** ⭐ **Principal** - Scrape les 3 jeux via URLs directes
- **`scraper-eurodreams.js`** - Scraper dédié EuroDreams
- **`scraper-puppeteer.js`** - Scraper des derniers résultats

## 📝 Notes

### Pourquoi garder les anciens scrapers ?

1. **Référence historique** - Comprendre l'évolution du projet
2. **Apprentissage** - Voir pourquoi certaines approches n'ont pas fonctionné
3. **Backup** - Au cas où la structure du site FDJ change

### Migration recommandée

Si vous utilisez encore un ancien scraper, migrez vers :
```bash
# Au lieu de
node utils/scraper-fdj.js

# Utilisez
node scraper-urls-directes.js 1
```

## 🔄 Scripts npm disponibles

```json
{
  "fix-eurodreams": "node utils/fix-eurodreams-jackpot.js",
  "nettoyer-cache": "node utils/nettoyer-cache.js",
  "update-cache": "node utils/update-cache-3-mois.js"
}
```

Utilisez :
```bash
npm run fix-eurodreams
npm run nettoyer-cache
npm run update-cache
```

---

[⬅️ Retour à la racine](../)

