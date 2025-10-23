# 🚀 Guide rapide : Utilisation de Puppeteer

## ✅ Installation terminée !

Puppeteer est maintenant installé et configuré dans votre projet.

---

## 🎯 Utilisation simple

### Méthode 1 : Script npm (RECOMMANDÉ)

```bash
npm run scrape
```

### Méthode 2 : Commande directe

```bash
node scraper-puppeteer.js
```

### Méthode 3 : Fichier batch Windows

Double-cliquez sur : **`update-resultats-puppeteer.bat`**

---

## 📊 Que fait le scraper ?

1. ✅ Lance un navigateur Chrome invisible (headless)
2. ✅ Va sur le site FDJ (Euromillions et Loto)
3. ✅ Récupère tous les résultats :
   - 🎰 Numéros gagnants
   - ⭐ Étoiles / N° Chance
   - 💰 Jackpots
   - 📊 Répartition complète des gains (tous les rangs)
4. ✅ Met à jour le fichier `resultats-cache.json`
5. ✅ Conserve l'historique des 3 derniers mois

---

## 📋 Résultats affichés

Après l'exécution, vous verrez :

```
╔════════════════════════════════════════════╗
║   🚀 SCRAPER MODERNE AVEC PUPPETEER      ║
╠════════════════════════════════════════════╣
║   Date: 23/10/2025 15:21:25              ║
╚════════════════════════════════════════════╝

🎯 Scraping Euromillions avec Puppeteer...
📡 Navigation vers la page Euromillions...
✅ Euromillions 2025-10-21
   Numéros: 5, 24, 29, 40, 42
   Étoiles: 6, 12
   Jackpot: 52 000 000 €
   Répartition: 12 rangs
✅ Euromillions mis à jour dans le cache

⏳ Pause de 3 secondes...

🍀 Scraping Loto avec Puppeteer...
📡 Navigation vers la page Loto...
✅ Loto 2025-10-22
   Numéros: 4, 29, 31, 39, 49
   N° Chance: 1
   Jackpot: 3 000 000 €
   Répartition: 8 rangs
✅ Loto mis à jour dans le cache

✅ Cache mis à jour avec succès !
📊 Euromillions: 26 tirages
📊 Loto: 40 tirages

✨ Scraping terminé avec Puppeteer !
```

---

## ⏱️ Temps d'exécution

- **Première utilisation** : ~40 secondes (téléchargement de Chrome)
- **Utilisations suivantes** : ~20-30 secondes

---

## 🔄 Planification automatique

Pour mettre à jour automatiquement les résultats :

1. Modifiez `start-scheduler.bat` pour utiliser Puppeteer
2. Ou configurez une tâche planifiée Windows qui exécute :
   ```
   npm run scrape
   ```

---

## 📁 Fichiers créés

| Fichier | Description |
|---------|-------------|
| `scraper-puppeteer.js` | ✨ Script principal Puppeteer |
| `update-resultats-puppeteer.bat` | Batch pour Windows |
| `resultats-cache.json` | Cache des résultats (mis à jour) |
| `SOLUTION_PUPPETEER.md` | Documentation complète |
| `COMPARAISON_SCRAPERS.md` | Comparaison des solutions testées |
| `GUIDE_PUPPETEER.md` | Ce guide |

---

## 🛠️ Scripts npm disponibles

```bash
npm run dev           # Démarrer l'application React
npm run scrape        # Scraper avec Puppeteer (recommandé) ✨
npm run scrape-old    # Ancien scraper (fallback)
npm run update-cache  # Mise à jour du cache
npm run build         # Build de production
npm run preview       # Prévisualiser le build
```

---

## ⚙️ Configuration avancée

Le scraper peut être personnalisé dans `scraper-puppeteer.js` :

```javascript
const browser = await puppeteer.launch({
  headless: 'new',     // Mode sans interface
  // headless: false,  // Décommenter pour voir le navigateur
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox'
  ]
});
```

---

## 🐛 Dépannage

### Problème : "Chrome not found"
**Solution :** Puppeteer télécharge automatiquement Chrome. Attendez la fin de l'installation.

### Problème : Timeout
**Solution :** Vérifiez votre connexion internet. Le script attend 30 secondes max.

### Problème : Données incomplètes
**Solution :** Le script vérifie automatiquement. Si les données sont incomplètes, le cache n'est pas modifié.

---

## 📊 Vérification des résultats

Après l'exécution, vérifiez `resultats-cache.json` :

```json
{
  "lastUpdate": "2025-10-23T13:21:28.456Z",
  "euromillions": [
    {
      "id": "em-0",
      "date": "2025-10-21",
      "numbers": [5, 24, 29, 40, 42],
      "stars": [6, 12],
      "jackpot": "52 000 000 €",
      "winningsDistribution": [...]
    }
  ]
}
```

---

## 🎯 Comparaison avant/après

### ❌ Avant (node-fetch + cheerio)
```json
{
  "rank": 1,
  "winners": "0",
  "amount": "Non disponible"  // ❌ Manquant
}
```

### ✅ Après (Puppeteer)
```json
{
  "rank": 1,
  "combination": "5 numéros + 2 étoiles",
  "winners": "0",
  "amount": "52 000 000 €"  // ✅ Complet !
}
```

---

## 🎉 Résultat

**Vos résultats sont maintenant 100% fiables et complets !**

Utilisez simplement :
```bash
npm run scrape
```

Et profitez de données parfaitement à jour ! 🚀

