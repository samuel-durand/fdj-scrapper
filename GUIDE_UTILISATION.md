# 📖 Guide d'Utilisation - Application Loterie FDJ

## 🚀 Démarrage Rapide

### Option 1 : Tout en Une (Recommandé)
```bash
start-all.bat
```
Lance automatiquement :
- ✅ Serveur proxy (port 3001)
- ✅ Application React (port 5173)

Puis ouvrir : **http://localhost:5173**

---

## 📊 Mise à Jour des Résultats

### Mettre à jour manuellement (3 derniers mois)
```bash
update-resultats.bat
```

Ou directement :
```bash
node update-cache-3-mois.js
```

Ce script va :
1. 🎯 Scraper le dernier tirage Euromillions depuis [FDJ](https://www.fdj.fr/jeux-de-tirage/euromillions-my-million/resultats)
2. 🍀 Scraper le dernier tirage Loto
3. 📦 Charger les données fallback pour 2025
4. 🗓️ Filtrer les 3 derniers mois
5. 💾 Sauvegarder dans `resultats-cache.json`

---

## 🎮 Utilisation de l'Application

### Navigation

#### 1. **Onglets Principaux**
- ⭐ **EuroMillions - My Million** : Résultats Euromillions
- 🍀 **Loto®** : Résultats Loto

#### 2. **Modes d'Affichage**

**📋 Liste Simple**
- Affiche les 5 derniers tirages
- Vue condensée et rapide

**📊 Tous les Tirages** ⭐ (avec pagination)
- Affiche tous les tirages des 3 derniers mois
- Navigation par page (5 tirages par page)
- Filtre par mois
- Cliquez sur un tirage pour voir les détails complets

**📅 Calendrier**
- Vue calendrier mensuel
- Cliquez sur une date pour voir le tirage

---

## 🎯 Fonctionnalités Principales

### ✅ Pagination Fonctionnelle
- **30 tirages Euromillions** des 3 derniers mois
- **43 tirages Loto** des 3 derniers mois
- Navigation fluide entre les pages
- Filtre par mois disponible

### ✅ Détails Complets
Cliquez sur un tirage (en mode Pagination) pour voir :
- 🎲 Tous les numéros et étoiles/chance
- 💰 Jackpot du tirage
- 📊 Répartition complète des gains
- 👥 Nombre de gagnants par rang

### ✅ Données Officielles
- Dernier tirage scrapé depuis le site FDJ
- Données historiques des 3 derniers mois
- Jackpots et répartitions des gains

---

## 📁 Fichiers Importants

| Fichier | Description |
|---------|-------------|
| `resultats-cache.json` | Cache des résultats (30 Euro + 43 Loto) |
| `year-data-2025.js` | Données fallback pour 2025 |
| `update-cache-3-mois.js` | Script de mise à jour du cache |
| `server-proxy-example.js` | Serveur API (port 3001) |
| `scraper-fdj.js` | Scraper FDJ original |

---

## 🔧 Scripts Disponibles

### Démarrage
- `start-all.bat` - Démarrage complet ⭐
- `start-app.bat` - Application seule
- `start-proxy.bat` - Serveur proxy seul
- `restart-servers.bat` - Redémarrage des serveurs

### Mise à Jour
- `update-resultats.bat` - Mise à jour des résultats ⭐

---

## 🎨 Design

L'application dispose d'un design moderne inspiré du site FDJ :

### ✨ Animations
- **Boules animées** : Apparition en rotation 3D
- **Jackpot pulsant** : Effet de lueur dorée
- **Cartes interactives** : Effet shimmer au survol
- **Transitions fluides** : Animations cubiques

### 🎨 Couleurs FDJ Officielles
- **Bleu** : #0052CC (EuroMillions)
- **Vert** : #00C389 (Loto)
- **Or** : #FFB800 (Jackpots)
- **Fond blanc** : Design épuré et moderne

---

## 📊 Exemple de Résultat

### EuroMillions du 17/10/2025
```
📅 Date: Vendredi 17 octobre 2025
🎲 Numéros: 13, 35, 39, 44, 47
⭐ Étoiles: 3, 5
💰 Jackpot: 39 000 000 €
📊 Répartition des gains: 15 rangs disponibles
```

---

## 🔄 Fréquence de Mise à Jour

### Automatique (recommandé)
Lancer `update-resultats.bat` après chaque tirage :
- **EuroMillions** : Mardi et Vendredi soir (après 21h30)
- **Loto** : Lundi, Mercredi et Samedi soir (après 20h30)

### Manuelle
Utiliser le bouton de mise à jour dans l'interface (à venir)

---

## 🐛 Dépannage

### Problème : Pagination vide
**Solution** : Lancer `update-resultats.bat`

### Problème : Serveur ne démarre pas
**Solution** : Vérifier que le port 3001 est libre
```bash
netstat -ano | findstr :3001
```

### Problème : Aucune donnée affichée
**Solution** : 
1. Vérifier `resultats-cache.json` existe et contient des données
2. Redémarrer avec `restart-servers.bat`
3. Vérifier la console navigateur (F12)

---

## 📱 Navigation Rapide

### Mode Liste
- Affichage immédiat des 5 derniers tirages
- Pas de navigation nécessaire
- Idéal pour un aperçu rapide

### Mode Pagination ⭐
- **Page 1** : Tirages du 31/10 au 17/10
- **Page 2** : Tirages du 14/10 au 30/09
- **Page 3** : Tirages du 26/09 au 12/09
- **Page 4** : Tirages du 09/09 au 26/08
- **Page 5** : Tirages du 22/08 au 08/08
- **Page 6** : Tirages plus anciens

### Filtre par Mois
- **Octobre 2025** : 7 tirages Euromillions
- **Septembre 2025** : 9 tirages
- **Août 2025** : 9 tirages
- **Juillet 2025** : 5 tirages (partiel)

---

## 🎯 Statistiques Actuelles

```
📊 Données disponibles:

EuroMillions:
  ✅ 30 tirages (3 derniers mois)
  ✅ Du 31/07/2025 au 31/10/2025
  ✅ 2 tirages/semaine (Mardi, Vendredi)

Loto:
  ✅ 43 tirages (3 derniers mois)
  ✅ Du 30/07/2025 au 30/10/2025
  ✅ 3 tirages/semaine (Lundi, Mercredi, Samedi)
```

---

## ⚠️ Important

### Résultats Officiels
- ✅ Dernier tirage scrapé depuis FDJ.fr
- 📊 Données historiques basées sur le fallback
- 🔄 Mise à jour manuelle requise pour nouveaux tirages

### Jeu Responsable
- 🔞 Interdit aux mineurs
- ♠️ Jouer comporte des risques
- 📞 09-74-75-13-13 (aide)

---

## 📞 Liens Utiles

- [Site FDJ Euromillions](https://www.fdj.fr/jeux-de-tirage/euromillions-my-million/resultats)
- [Site FDJ Loto](https://www.fdj.fr/jeux-de-tirage/loto/resultats)
- [Résultats Officiels FDJ](https://www.fdj.fr/resultats-et-rapports-officiels)

---

**Application mise à jour le 21/10/2025** 🎰✨

**Bon jeu responsable ! 🍀**

