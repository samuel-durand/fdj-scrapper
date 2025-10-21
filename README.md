# 🎰 Résultats des Loteries

Application React moderne pour afficher les résultats des loteries françaises (Euromillions et Loto).

## ✨ Fonctionnalités

- 🎲 Affichage des résultats de l'Euromillions
- 🍀 Affichage des résultats du Loto
- 📅 **NOUVEAU** : Calendrier interactif pour naviguer entre les résultats
- 📡 Récupération automatique des résultats en temps réel
- 🔄 Système de fallback avec données de secours
- ⚡ Indicateurs de chargement et gestion des erreurs
- 🎨 Double vue : Liste et Calendrier
- 📱 Interface responsive et moderne
- 🎨 Design élégant avec animations
- 🔄 Navigation par onglets entre les différentes loteries

## 🚀 Installation

### Prérequis

- Node.js (version 16 ou supérieure)
- npm ou yarn

### Étapes d'installation

1. Ouvrez un terminal dans le dossier du projet

2. Installez les dépendances :
```bash
npm install
```

3. Lancez le serveur de développement :
```bash
npm run dev
```

4. Ouvrez votre navigateur et accédez à l'URL affichée dans le terminal (généralement http://localhost:5173)

## 📦 Scripts disponibles

- `npm run dev` - Lance le serveur de développement
- `npm run build` - Compile l'application pour la production
- `npm run preview` - Prévisualise la version de production

## 🎯 Utilisation

1. L'application s'ouvre sur l'onglet Euromillions par défaut
2. Cliquez sur les onglets pour basculer entre Euromillions et Loto
3. **Deux modes d'affichage** :
   - **📋 Vue Liste** : Affichage classique des derniers résultats
   - **📅 Vue Calendrier** : Navigation mensuelle interactive
4. Dans le calendrier :
   - 🔵 Jours bleus = Jours de tirage
   - 🟢 Jours verts = Résultats disponibles (cliquez pour voir !)
   - Naviguez entre les mois avec ◀ ▶
5. Chaque tirage affiche :
   - La date du tirage
   - Le montant du jackpot
   - Les numéros gagnants
   - Les étoiles (Euromillions) ou le numéro chance (Loto)

## 🔧 Configuration API

### Mode par défaut - Parsing JSON Intelligent ✨

L'application utilise maintenant un **système intelligent** avec plusieurs stratégies :

1. **Multi-endpoints** : Teste automatiquement plusieurs URLs
2. **Parsing JSON direct** : Si l'API JSON existe
3. **Extraction HTML** : Parse le HTML pour trouver le JSON embarqué (`__NEXT_DATA__`, etc.)
4. **Fallback** : Affiche des données de secours si tout échoue

Si l'API n'est pas disponible (problème CORS ou autre), elle affiche des données de secours.

### Utiliser le serveur proxy (Recommandé)

Pour contourner les restrictions CORS et récupérer les vraies données :

1. Installez les dépendances du proxy :
```bash
npm install --save-dev express cors node-fetch
```

2. Lancez le serveur proxy :
```bash
node server-proxy-example.js
```

3. Modifiez `src/services/lotteryService.js` :
```javascript
const FDJ_API_BASE = 'http://localhost:3001/api';
```

4. Dans un autre terminal, lancez l'application React :
```bash
npm run dev
```

### Documentation complète

Consultez :
- **`GUIDE_PARSING_JSON.md`** - 🆕 Guide complet sur le parsing JSON et extraction HTML
- **`INTEGRATION_API.md`** - Comprendre le fonctionnement de l'API
- **`DEMARRAGE_RAPIDE.md`** - Guide de démarrage rapide

Couvre :
- Comment fonctionne le parsing JSON multi-format
- Solutions aux problèmes CORS
- Options d'intégration avancées
- Formats de données supportés
- Test des endpoints avec `test-api-fdj.js`

### Modifier les couleurs

Les couleurs principales sont définies dans `src/index.css` avec les variables CSS :
- `--primary-blue` : Couleur principale bleue
- `--primary-gold` : Couleur dorée
- `--primary-green` : Couleur verte
- etc.

## 📁 Structure du projet

```
loterie/
├── src/
│   ├── components/
│   │   ├── Euromillions.jsx      # Composant Euromillions
│   │   ├── Loto.jsx               # Composant Loto
│   │   └── Lottery.css            # Styles des composants loterie
│   ├── services/
│   │   └── lotteryService.js      # Service API pour récupérer les résultats
│   ├── App.jsx                    # Composant principal
│   ├── App.css                    # Styles de l'application
│   ├── main.jsx                   # Point d'entrée
│   └── index.css                  # Styles globaux
├── server-proxy-example.js        # Serveur proxy pour contourner CORS
├── package-proxy.json             # Dépendances du proxy
├── INTEGRATION_API.md             # Documentation API complète
├── index.html                     # Template HTML
├── package.json                   # Dépendances
└── vite.config.js                # Configuration Vite
```

## 🌐 Récupération des Résultats

### État Actuel

L'application utilise `src/services/lotteryService.js` qui :
1. Tente de récupérer les résultats depuis l'API FDJ
2. En cas d'échec, affiche des données de secours
3. Gère automatiquement les états de chargement et d'erreur

### Options disponibles

- **Mode Direct** : Tente d'accéder directement à l'API FDJ (peut être bloqué par CORS)
- **Mode Proxy** : Utilise `server-proxy-example.js` pour contourner CORS
- **Mode Fallback** : Affiche des données d'exemple si l'API n'est pas disponible

Consultez `INTEGRATION_API.md` pour plus de détails.

## 🎨 Technologies utilisées

- **React 18** - Framework JavaScript
- **Vite** - Build tool rapide
- **Fetch API** - Récupération des données
- **CSS3** - Styles modernes avec gradients et animations
- **Express** (optionnel) - Serveur proxy pour contourner CORS

## 📝 Notes

- L'application tente de récupérer les résultats réels, mais peut afficher des données d'exemple en cas d'erreur
- Pour un usage en production, consultez toujours les sources officielles (fdj.fr)
- L'application est optimisée pour une utilisation mobile et desktop
- Les données sont fournies à titre indicatif uniquement
- Respectez les conditions d'utilisation du site FDJ

## ⚠️ Limitations

- Les API de la FDJ peuvent nécessiter un proxy pour fonctionner (CORS)
- Les endpoints utilisés ne sont pas officiellement documentés
- Pour un usage commercial, contactez la FDJ pour un accès officiel

## 📄 Licence

Ce projet est libre d'utilisation pour un usage personnel ou éducatif.

---

Fait avec ❤️ pour les amateurs de loteries

