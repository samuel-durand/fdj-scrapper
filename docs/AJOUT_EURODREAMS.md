# 💤 Ajout d'Eurodreams à l'Application Loterie

## 📋 Vue d'ensemble

Eurodreams est maintenant intégré à l'application de résultats de loterie FDJ !

### ℹ️ À propos d'Eurodreams

- **Tirages** : Lundis et Jeudis à 21h
- **Format** : 6 numéros (1-40) + 1 numéro Dream (1-5)
- **Gain** : Rente mensuelle de 20 000 € pendant 30 ans

## 🆕 Nouveaux fichiers créés

### 1. **scraper-eurodreams.js**
Scraper dédié pour récupérer uniquement les résultats Eurodreams.

**Utilisation** :
```bash
node scraper-eurodreams.js 3     # Récupère les 3 derniers mois
npm run scrape-eurodreams        # Script npm
```

### 2. **src/components/Eurodreams.jsx**
Composant React pour afficher les résultats Eurodreams.

**Fonctionnalités** :
- ✅ Affichage des 6 numéros principaux
- ✅ Affichage du numéro Dream (boule dorée animée)
- ✅ Rente mensuelle
- ✅ Calendrier de filtrage
- ✅ Pagination
- ✅ Modal de détails
- ✅ Répartition des gains

## 🔄 Fichiers modifiés

### 1. **scraper-urls-directes.js**
Le scraper principal inclut maintenant Eurodreams.

**Ajouts** :
- ✅ `generateEurodreamsUrls()` - Génère les URLs pour les lundis et jeudis
- ✅ `scrapEurodreamsPage()` - Scrape une page Eurodreams
- ✅ Intégration dans la fonction `main()`

**Résultats** :
```json
{
  "eurodreams": [
    {
      "id": "eurodreams-0",
      "date": "2025-10-20",
      "day": "Lundi",
      "formattedDate": "20 octobre 2025",
      "numbers": [8, 18, 21, 25, 32, 33],
      "dreamNumber": 1,
      "jackpot": "20 000 € par mois",
      "winningsDistribution": [...]
    }
  ]
}
```

### 2. **src/App.jsx**
Application principale mise à jour.

**Modifications** :
- ✅ Import du composant `Eurodreams`
- ✅ Ajout de l'onglet "💤 EuroDreams"
- ✅ Fonction `getNextDrawDate()` mise à jour pour Eurodreams
- ✅ Gestion de l'affichage du composant Eurodreams

### 3. **src/components/Lottery.css**
Nouveaux styles pour Eurodreams.

**Classes ajoutées** :
```css
.eurodreams-header      /* En-tête violet dégradé */
.eurodreams-card        /* Carte avec bordure violette */
.eurodreams-ball        /* Boules violettes */
.dream-section          /* Section Dream Number */
.dream-number           /* Boule dorée animée avec pulse */
.eurodreams-jackpot     /* Style de la rente */
```

### 4. **src/components/DrawDetailsModal.jsx**
Modal mis à jour pour Eurodreams.

**Ajouts** :
- ✅ Titre "💤 EuroDreams"
- ✅ Section Dream Number
- ✅ "Rente mensuelle" au lieu de "Jackpot"
- ✅ Répartition des gains spécifique

### 5. **src/components/DrawDetailsModal.css**
Nouveau style pour le Dream Number.

```css
.modal-dream-ball {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  box-shadow: 0 8px 25px rgba(251, 191, 36, 0.5);
}
```

### 6. **package.json**
Nouveau script ajouté.

```json
"scrape-eurodreams": "node scraper-eurodreams.js"
```

## 🎨 Design et UX

### Thème Eurodreams
- **Couleurs** : Violet (#667eea) et Indigo (#764ba2)
- **Boules Dream** : Dorées avec animation pulse
- **Cartes** : Fond lavande dégradé

### Animations
- ✅ Fade in des cartes de résultats
- ✅ Pulse sur le Dream Number
- ✅ Hover effects sur les cartes
- ✅ Modal avec animations fluides

## 📊 Structure des données

### Format Eurodreams
```javascript
{
  id: "eurodreams-0",
  date: "2025-10-20",           // ISO format
  day: "Lundi",                 // Jour de la semaine
  formattedDate: "20 octobre 2025",
  numbers: [8, 18, 21, 25, 32, 33],  // 6 numéros (1-40)
  dreamNumber: 1,               // Dream Number (1-5)
  jackpot: "20 000 € par mois", // Rente mensuelle
  winningsDistribution: [       // Répartition des gains
    {
      rank: 1,
      combination: "6 numéros + Dream",
      winners: "0",
      amount: "20 000 € par mois"
    },
    ...
  ]
}
```

## 🚀 Utilisation

### Récupérer les résultats Eurodreams

**Option 1 : Scraper complet (recommandé)**
```bash
node scraper-urls-directes.js 3
# Récupère Euromillions + Loto + Eurodreams des 3 derniers mois
```

**Option 2 : Scraper Eurodreams uniquement**
```bash
npm run scrape-eurodreams
# ou
node scraper-eurodreams.js 3
```

**Option 3 : Test rapide**
```bash
node scraper-eurodreams.js 0.1
# Récupère ~3 jours de résultats
```

### Visualiser dans l'application

1. Lancer le serveur :
   ```bash
   npm run dev
   ```

2. Ouvrir : `http://localhost:5173`

3. Cliquer sur l'onglet **"💤 EuroDreams"**

## 🎯 Fonctionnalités disponibles

### ✅ Affichage
- Liste complète des tirages
- Tri du plus récent au plus ancien
- Calendrier interactif
- Pagination (10 tirages par page)

### ✅ Filtrage
- Filtre par date via le calendrier
- Indicateur visuel des jours avec tirages
- Bouton "Réinitialiser le filtre"

### ✅ Détails
- Modal avec tous les détails
- 6 numéros principaux
- Dream Number animé
- Rente mensuelle
- Répartition complète des gains
- ID du tirage

## 📅 Jours de tirage

Eurodreams est tiré **2 fois par semaine** :
- 🗓️ **Lundi** à 21h00
- 🗓️ **Jeudi** à 21h00

Le scraper génère automatiquement les URLs pour tous les lundis et jeudis de la période demandée.

## 🔍 Exemple de scraping

```bash
$ node scraper-eurodreams.js 0.1

╔════════════════════════════════════════════╗
║   💤 SCRAPER EURODREAMS PUPPETEER       ║
╠════════════════════════════════════════════╣
║   Date: 23/10/2025 16:06:03              ║
╚════════════════════════════════════════════╝

🎯 Récupération des 0.1 derniers mois

📋 Génération des URLs...
   Eurodreams : 9 tirages attendus

═══════════════════════════════════════════
💤 EURODREAMS
═══════════════════════════════════════════

📡 lundi 20 octobre 2025...
   ✅ 8, 18, 21, 25, 32, 33 + 💤1
   💰 20 000 € par mois
   📊 6 rangs

📡 jeudi 16 octobre 2025...
   ✅ 1, 4, 6, 10, 34, 38 + 💤5
   💰 20 000 € par mois
   📊 6 rangs

✅ Eurodreams : 8/9 tirages récupérés

╔════════════════════════════════════════════╗
║   ✅ SCRAPING TERMINÉ !                   ║
╠════════════════════════════════════════════╣
║   Eurodreams :  8 tirages récupérés       ║
║   Fichier : resultats-cache.json          ║
╚════════════════════════════════════════════╝
```

## 🎨 Aperçu visuel

### En-tête Eurodreams
```
╔═══════════════════════════════════════╗
║  💤  Eurodreams                       ║
║  Tirages tous les Lundis et Jeudis   ║
║  6 numéros (1-40) + 1 Dream (1-5)    ║
╚═══════════════════════════════════════╝
```

### Carte de résultat
```
┌─────────────────────────────────────┐
│  Lundi 20 octobre 2025              │
│  💰 20 000 € par mois               │
│                                     │
│  Numéros : [8][18][21][25][32][33] │
│  💤 Dream : [1]                     │
│                                     │
│  [Voir les détails complets]        │
└─────────────────────────────────────┘
```

## ⚠️ Notes importantes

1. **Tirage du jour** : Le tirage du jour en cours peut ne pas être disponible avant 21h30.

2. **Jackpot spécial** : Certains tirages peuvent afficher un jackpot différent (ex: "6212 000 € par mois"). C'est normal, ce sont les données du site FDJ.

3. **Cache** : Les résultats sont stockés dans `resultats-cache.json` avec les autres jeux.

4. **Performance** : Le scraping complet des 3 jeux peut prendre quelques minutes selon la période.

## 🔧 Maintenance

### Mettre à jour les résultats
```bash
# Tout mettre à jour (recommandé)
node scraper-urls-directes.js 1

# Seulement Eurodreams
npm run scrape-eurodreams
```

### Vérifier le cache
```bash
cat resultats-cache.json | grep "eurodreams" -A 5
```

### Nettoyer le cache
```bash
npm run nettoyer-cache
```

## 📝 Résumé des commandes

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lancer l'application |
| `npm run scrape-eurodreams` | Scraper Eurodreams seul |
| `npm run scrape-complet` | Scraper les 3 jeux |
| `node scraper-eurodreams.js 3` | Scraper 3 mois d'Eurodreams |
| `node scraper-urls-directes.js 3` | Scraper 3 mois de tout |

## ✨ Prochaines étapes possibles

- [ ] Ajouter des statistiques pour Eurodreams
- [ ] Graphiques de fréquence des numéros
- [ ] Historique des gains
- [ ] Notifications des nouveaux tirages
- [ ] Export PDF des résultats

---

**🎉 Eurodreams est maintenant pleinement intégré à votre application !**

L'application affiche maintenant 3 jeux de loterie :
- ⭐ **EuroMillions - My Million** (Mardi & Vendredi)
- 🍀 **Loto®** (Lundi, Mercredi & Samedi)
- 💤 **EuroDreams** (Lundi & Jeudi)

