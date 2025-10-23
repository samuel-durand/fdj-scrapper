# 🎯 Comment fonctionne le Scraping FDJ

## ✨ Système Actuel (Choix Option 2)

Vous avez choisi le **scraping incrémental** - la meilleure solution ! 🎉

### 📊 Ce qui est scrapé à chaque tirage

**Euromillions** (Mardi et Vendredi à ~21h30) :
- ✅ 5 numéros gagnants (1-50)
- ✅ 2 étoiles (1-12)
- ✅ Jackpot réel en millions €
- ✅ **15 rangs de gains complets** avec :
  - Combinaison (ex: "5 numéros + 2 étoiles")
  - Nombre de gagnants en Europe
  - Montant des gains par gagnant

**Loto** (Lundi, Mercredi, Samedi à ~20h45) :
- ✅ 5 numéros gagnants (1-49)
- ✅ 1 numéro chance (1-10)
- ✅ Jackpot réel en millions €
- ✅ **9 rangs de gains complets** avec :
  - Combinaison (ex: "5 numéros + N° Chance")
  - Nombre de gagnants en France
  - Montant des gains par gagnant

### 🔄 Fonctionnement Automatique

1. **Le scheduler vérifie** les jours de tirage
2. **Le scraper récupère** les vraies données depuis https://www.fdj.fr
3. **Les données sont formatées** et validées
4. **Tout est sauvegardé** dans `resultats-cache.json`
5. **L'application affiche** les données en temps réel

### 📁 Structure du Cache

```json
{
  "euromillions": [
    {
      "id": "em-0",
      "date": "2025-10-17",
      "numbers": [13, 35, 39, 44, 47],
      "stars": [3, 5],
      "jackpot": "39 000 000 €",
      "winningsDistribution": [
        {
          "rank": 1,
          "combination": "5 numéros + 2 étoiles",
          "winners": "0",
          "amount": "Non disponible"
        },
        {
          "rank": 2,
          "combination": "5 numéros + 1 étoile",
          "winners": "1",
          "amount": "647 213,60 €"
        }
        // ... 13 autres rangs
      ]
    }
    // ... autres tirages
  ],
  "loto": [...],
  "lastUpdate": "2025-10-21T13:20:11.323Z"
}
```

## 🚀 Commandes Utiles

### Scraper Manuellement
```bash
# Forcer le scraping immédiat (n'importe quel jour)
node scraper-fdj.js --force

# Scraping normal (seulement les jours de tirage)
node scraper-fdj.js
```

### Lancer le Scheduler Automatique
```bash
# Lance le scraper automatiquement aux heures de tirage
npm run scheduler
```

### Démarrer l'Application Complète
```bash
# Terminal 1 : Serveur proxy
node server-proxy-example.js

# Terminal 2 : Application React
npm run dev

# OU utiliser les scripts batch
start-all.bat
```

## 📈 Construction de l'Historique

### Aujourd'hui (21/10/2025)
- **1 tirage Euromillions** avec vraies données (17/10/2025)
- **1 tirage Loto** avec vraies données (20/10/2025)
- **Tirages précédents** : données générées (pour avoir un historique complet)

### Dans 1 semaine
- **3 nouveaux tirages Euromillions** scrapés
- **4 nouveaux tirages Loto** scrapés
- Toutes les vraies données sont sauvegardées

### Dans 1 mois
- **~8 tirages Euromillions** avec vraies données
- **~12 tirages Loto** avec vraies données

### Dans 3 mois (fin janvier 2026)
- **~25 tirages Euromillions** avec vraies données
- **~38 tirages Loto** avec vraies données

### Dans 1 an
- **~104 tirages Euromillions** complets (toute l'année !)
- **~156 tirages Loto** complets (toute l'année !)

## 🎯 Avantages de Cette Approche

✅ **Fiable** : Scrape directement depuis le HTML structuré FDJ  
✅ **Complet** : Récupère TOUTES les données (numéros, jackpot, gains)  
✅ **Automatique** : Fonctionne sans intervention manuelle  
✅ **Propre** : Données bien formatées et validées  
✅ **Évolutif** : L'historique grandit naturellement  
✅ **Performant** : Pas besoin de parser des PDFs  

## ⚙️ Configuration Actuelle

### Jours de Scraping
- **Euromillions** : Mardi (2) et Vendredi (5)
- **Loto** : Lundi (1), Mercredi (3), Samedi (6)

### Sources de Données
- **Euromillions** : https://www.fdj.fr/jeux-de-tirage/euromillions-my-million/resultats
- **Loto** : https://www.fdj.fr/jeux-de-tirage/loto/resultats

### Stockage
- **Cache** : `resultats-cache.json`
- **Backup** : Créer manuellement des backups réguliers de ce fichier !

## 💡 Conseils

### Backup Régulier
```bash
# Créer un backup du cache
copy resultats-cache.json resultats-cache-backup-$(date +%Y%m%d).json
```

### Vérifier les Données
```bash
# Voir le dernier tirage Euromillions
node -e "console.log(JSON.stringify(require('./resultats-cache.json').euromillions[0], null, 2))"

# Voir le dernier tirage Loto
node -e "console.log(JSON.stringify(require('./resultats-cache.json').loto[0], null, 2))"
```

### Monitoring
- Vérifier régulièrement que le scraper fonctionne
- Consulter les logs du serveur proxy
- Tester l'application après chaque nouveau tirage

## 🎊 Résultat

Vous avez maintenant un système qui :
1. **Scrape automatiquement** les vrais résultats FDJ
2. **Sauvegarde tout** dans un format structuré
3. **Affiche magnifiquement** les données dans l'application
4. **Construit l'historique** au fil du temps

**Dans quelques mois, vous aurez une base de données complète de TOUS les tirages 2025-2026 avec les vraies données FDJ ! 🎉**

---

**Date de mise en place** : 21 octobre 2025  
**Prochains tirages attendus** :  
- Loto : Mercredi 23/10/2025  
- Euromillions : Vendredi 25/10/2025

