# 🎰 Jeux de Loterie Disponibles

## Vue d'ensemble

L'application affiche les résultats de **3 jeux de loterie FDJ** :

| Jeu | Icône | Tirages | Format |
|-----|-------|---------|--------|
| **EuroMillions - My Million** | ⭐ | Mar & Ven à 20h30 | 5 nums (1-50) + 2 étoiles (1-12) + code |
| **Loto®** | 🍀 | Lun, Mer & Sam à 20h30 | 5 nums (1-49) + N° Chance (1-10) + codes |
| **EuroDreams** | 💤 | Lun & Jeu à 21h00 | 6 nums (1-40) + 1 Dream (1-5) |

---

## ⭐ EuroMillions - My Million

### 📋 Informations générales
- **Tirages** : Mardi et Vendredi à 20h30
- **Prix** : 2,50 € (option My Million incluse)
- **Jackpot minimum** : 17 millions d'euros
- **Jackpot record** : 220 millions d'euros

### 🎯 Format du jeu
1. **5 numéros** entre 1 et 50
2. **2 étoiles** entre 1 et 12
3. **Code My Million** : garantit 1 gagnant de 1 million d'€ par tirage

### 💰 Gains
- **Rang 1** : 5 numéros + 2 étoiles = Jackpot
- **Rang 2** : 5 numéros + 1 étoile
- **Rang 3** : 5 numéros
- ... jusqu'à 12 rangs
- **My Million** : 1 000 000 €

### 📊 Données disponibles
```json
{
  "numbers": [5, 24, 29, 40, 42],
  "stars": [6, 12],
  "myMillionCode": "OA 155 5726",
  "jackpot": "52 000 000 €",
  "winningsDistribution": [...]
}
```

### 🎨 Design
- **Couleurs** : Bleu (#0052cc) et Or
- **Boules** : Bleues pour les numéros, dorées pour les étoiles
- **Code My Million** : Fond violet avec texte blanc

---

## 🍀 Loto®

### 📋 Informations générales
- **Tirages** : Lundi, Mercredi et Samedi à 20h30
- **Prix** : 2,20 € (avec option 2nd tirage et Joker+)
- **Jackpot minimum** : 2 millions d'euros
- **Jackpot record** : 36 millions d'euros

### 🎯 Format du jeu
1. **5 numéros** entre 1 et 49
2. **1 numéro Chance** entre 1 et 10
3. **2ème tirage** (optionnel) : 5 numéros supplémentaires
4. **Joker+** (optionnel) : code à 7 chiffres

### 💰 Gains
- **Rang 1** : 5 numéros + N° Chance = Jackpot
- **Rang 2** : 5 numéros
- **Rang 3** : 4 numéros + N° Chance
- ... jusqu'à 8 rangs
- **2ème tirage** : 5 rangs supplémentaires
- **Joker+** : jusqu'à 500 000 €

### 📊 Données disponibles
```json
{
  "numbers": [4, 29, 31, 39, 49],
  "luckyNumber": 1,
  "secondDraw": [12, 15, 23, 34, 41],
  "jokerPlus": "1 234 567",
  "jackpot": "3 000 000 €",
  "winningsDistribution": [...]
}
```

### 🎨 Design
- **Couleurs** : Vert (#00c389) et trèfle
- **Boules** : Vertes pour les numéros, orange pour le N° Chance
- **2ème tirage** : Fond gris avec bordure
- **Joker+** : Fond jaune avec bordure orange

---

## 💤 EuroDreams

### 📋 Informations générales
- **Tirages** : Lundi et Jeudi à 21h00
- **Prix** : 2,50 €
- **Gain unique** : 20 000 € par mois pendant 30 ans
- **Total** : 7,2 millions d'euros (rente viagère)

### 🎯 Format du jeu
1. **6 numéros** entre 1 et 40
2. **1 Dream Number** entre 1 et 5

### 💰 Gains
- **Rang 1** : 6 numéros + Dream = 20 000 €/mois pendant 30 ans
- **Rang 2** : 6 numéros = 2 000 €/mois pendant 5 ans
- **Rang 3** : 5 numéros + Dream
- ... jusqu'à 6 rangs

### 📊 Données disponibles
```json
{
  "numbers": [8, 18, 21, 25, 32, 33],
  "dreamNumber": 1,
  "jackpot": "20 000 € par mois",
  "winningsDistribution": [...]
}
```

### 🎨 Design
- **Couleurs** : Violet (#667eea) et Indigo (#764ba2)
- **Boules** : Violettes pour les numéros
- **Dream Number** : Dorée avec animation pulse
- **Thème** : Rêve et sommeil

---

## 🔄 Scraping des résultats

### Scraper tous les jeux (recommandé)
```bash
node scraper-urls-directes.js 3
# Récupère 3 mois de résultats pour les 3 jeux
```

### Scraper par jeu
```bash
# EuroMillions + Loto + EuroDreams récents
node scraper-puppeteer.js

# Eurodreams uniquement
npm run scrape-eurodreams

# Historique complet
recuperer-historique-complet.bat
```

### Fichiers batch Windows
```bash
# Tous les jeux
recuperer-historique-complet.bat

# Eurodreams
scrape-eurodreams.bat
```

---

## 📅 Calendrier des tirages

| Jour | Jeux disponibles |
|------|-----------------|
| **Lundi** | 🍀 Loto + 💤 EuroDreams |
| **Mardi** | ⭐ EuroMillions |
| **Mercredi** | 🍀 Loto |
| **Jeudi** | 💤 EuroDreams |
| **Vendredi** | ⭐ EuroMillions |
| **Samedi** | 🍀 Loto |
| **Dimanche** | _Pas de tirage_ |

### Heures de tirage
- **EuroMillions** : 20h30
- **Loto** : 20h30
- **EuroDreams** : 21h00

---

## 🎯 Fonctionnalités de l'application

### ✅ Pour tous les jeux

#### Affichage
- 📋 Liste complète des tirages
- 📅 Calendrier interactif
- 🔢 Pagination (10 tirages/page)
- 🎨 Design unique par jeu
- 📱 Responsive (mobile & desktop)

#### Filtrage
- 📅 Filtre par date
- 🔍 Indicateurs visuels
- ↻ Réinitialisation facile

#### Modal de détails
- 🎯 Numéros gagnants
- 💰 Jackpot/Rente
- 📊 Répartition complète des gains
- 🆔 ID du tirage
- ⌨️ Fermeture avec Escape

---

## 📦 Structure du cache

Le fichier `resultats-cache.json` contient :

```json
{
  "lastUpdate": "2025-10-23T14:06:03.123Z",
  "euromillions": [
    {
      "id": "em-0",
      "date": "2025-10-21",
      "numbers": [5, 24, 29, 40, 42],
      "stars": [6, 12],
      "myMillionCode": "OA 155 5726",
      "jackpot": "52 000 000 €",
      "winningsDistribution": [...]
    }
  ],
  "loto": [
    {
      "id": "loto-0",
      "date": "2025-10-22",
      "numbers": [4, 29, 31, 39, 49],
      "luckyNumber": 1,
      "secondDraw": [12, 15, 23, 34, 41],
      "jokerPlus": "1 234 567",
      "jackpot": "3 000 000 €",
      "winningsDistribution": [...]
    }
  ],
  "eurodreams": [
    {
      "id": "eurodreams-0",
      "date": "2025-10-20",
      "numbers": [8, 18, 21, 25, 32, 33],
      "dreamNumber": 1,
      "jackpot": "20 000 € par mois",
      "winningsDistribution": [...]
    }
  ]
}
```

---

## 🎨 Palette de couleurs

### EuroMillions
```css
Primary: #0052cc (Bleu)
Secondary: #ffb800 (Or)
Gradient: linear-gradient(135deg, #0052cc, #003d99)
```

### Loto
```css
Primary: #00c389 (Vert)
Secondary: #ff6b35 (Orange)
Gradient: linear-gradient(135deg, #00c389, #00a073)
```

### EuroDreams
```css
Primary: #667eea (Violet)
Secondary: #764ba2 (Indigo)
Dream: #fbbf24 (Or)
Gradient: linear-gradient(135deg, #667eea, #764ba2)
```

---

## 📊 Statistiques

### Tirages par semaine
- **EuroMillions** : 2 tirages
- **Loto** : 3 tirages
- **EuroDreams** : 2 tirages
- **Total** : 7 tirages/semaine

### Tirages par mois (environ)
- **EuroMillions** : ~8-9 tirages
- **Loto** : ~13 tirages
- **EuroDreams** : ~8-9 tirages
- **Total** : ~30 tirages/mois

---

## 🚀 Démarrage rapide

### 1. Récupérer les résultats
```bash
node scraper-urls-directes.js 1
```

### 2. Lancer l'application
```bash
npm run dev
```

### 3. Ouvrir dans le navigateur
```
http://localhost:5173
```

### 4. Explorer
- Cliquer sur les onglets : ⭐ EuroMillions, 🍀 Loto, 💤 EuroDreams
- Utiliser le calendrier pour filtrer
- Cliquer sur "Voir les détails" pour plus d'infos

---

## 🔧 Maintenance

### Mettre à jour tous les jeux
```bash
node scraper-urls-directes.js 1
```

### Mettre à jour un jeu spécifique
```bash
npm run scrape-eurodreams
```

### Nettoyer le cache
```bash
npm run nettoyer-cache
```

### Vérifier les résultats
```bash
cat resultats-cache.json
```

---

## 📝 Résumé

L'application propose maintenant **3 jeux complets** :
1. ⭐ **EuroMillions** avec My Million
2. 🍀 **Loto** avec 2ème tirage et Joker+
3. 💤 **EuroDreams** avec rente mensuelle

Tous les jeux ont :
- ✅ Scraping automatique
- ✅ Design unique
- ✅ Données complètes
- ✅ Interface intuitive
- ✅ Responsive design

**🎉 Profitez de votre application de loterie complète !**

