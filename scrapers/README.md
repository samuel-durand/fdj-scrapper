# 🎰 Scrapers FDJ

Ce dossier contient tous les scrapers pour récupérer les résultats des jeux FDJ.

## 📁 Fichiers

### 🎯 Scraper Principal (Recommandé)

- **`scraper-tirage-du-jour.js`** ⭐
  - Scraper intelligent qui récupère uniquement les tirages récents (7 derniers jours)
  - **Données complètes** : My Million, codes gagnants, distributions des gains
  - **Optimisé** : Rapide (~2 minutes au lieu de 15+)
  - **Auto-tri** : Trie les tirages par date décroissante
  - **Utilisation** : `npm run scrape-today`
  - **GitHub Actions** : Utilisé automatiquement tous les soirs à 22h30

### 🔧 Autres Scrapers

- **`scraper-puppeteer.js`**
  - Scraper historique complet (tous les tirages depuis 2017)
  - Utilise Puppeteer pour naviguer sur le site FDJ
  - Plus lent mais récupère tout l'historique
  - **Utilisation** : `npm run scrape`

- **`scraper-urls-directes.js`**
  - Scraper qui utilise des URLs directes
  - Moins fiable (structure HTML peut changer)
  - **Utilisation** : `npm run scrape-complet`

- **`scraper-eurodreams.js`**
  - Scraper spécifique pour EuroDreams
  - **Utilisation** : `npm run scrape-eurodreams`

## 🎮 Jeux supportés

- **EuroMillions** : Numéros, étoiles, jackpot, My Million, gains (15 rangs)
- **Loto** : Numéros, numéro chance, jackpot, 10 codes gagnants, gains (9 rangs)
- **EuroDreams** : Numéros, dream number, rente mensuelle, gains (6 rangs)

## 📊 Données récupérées

### EuroMillions
```json
{
  "numbers": [7, 8, 24, 35, 49],
  "stars": [2, 12],
  "jackpot": "75 millions €",
  "myMillionCode": "KT 230 2700",
  "winningsDistribution": [...]
}
```

### Loto
```json
{
  "numbers": [10, 23, 45, 47, 48],
  "luckyNumber": 8,
  "jackpot": "5 millions €",
  "codesGagnants": ["B 4177 8799", ...],
  "winningsDistribution": [...]
}
```

### EuroDreams
```json
{
  "numbers": [18, 19, 21, 23, 30, 35],
  "dreamNumber": 1,
  "jackpot": "30 000 € par mois pendant 30 ans",
  "winningsDistribution": [...]
}
```

## 🚀 Utilisation

### Scraping quotidien (recommandé)
```bash
npm run scrape-today
```

### Récupération complète de l'historique
```bash
npm run scrape
```

## 🔄 Automatisation

Le scraper intelligent (`scraper-tirage-du-jour.js`) tourne automatiquement :
- **Quand** : Tous les jours à 22h30 CET
- **Où** : GitHub Actions
- **Résultat** : Upload automatique sur o2switch

## 📝 Notes

- Les scrapers utilisent **Puppeteer** pour gérer le JavaScript du site FDJ
- Les données sont sauvegardées dans `resultats-cache.json` à la racine
- Le cache est **automatiquement trié** par date (plus récent en premier)
- Les **doublons sont évités** (vérification par ID et date)

## 🛠️ Maintenance

Si le scraper ne fonctionne plus, c'est probablement que **le site FDJ a changé** sa structure HTML.

### Débogage
1. Vérifier les sélecteurs CSS dans le scraper
2. Utiliser les scripts de debug (créer un fichier `debug-XXX.js`)
3. Tester manuellement sur une URL FDJ récente

