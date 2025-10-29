# 🔔 Système d'Alertes Personnalisées - Installation et Utilisation

## 🎉 Nouveauté !

Votre application de résultats FDJ dispose maintenant d'un **système d'alertes personnalisées complet** !

---

## ✨ Ce qui a été ajouté

### Fonctionnalités principales
- ✅ **4 types d'alertes** : Jackpot, Numéros favoris, Nouveaux tirages, Numéro chance
- ✅ **Centre de notifications** avec badge et compteur
- ✅ **Vérification automatique** des tirages
- ✅ **Interface complète** de gestion des alertes
- ✅ **Design moderne** et responsive

### Fichiers créés
```
src/
├── services/
│   └── alertService.js              # Service de gestion des alertes
├── components/
│   └── Alerts/
│       ├── AlertConfig.jsx          # Création d'alertes (3 étapes)
│       ├── AlertsList.jsx           # Liste des alertes
│       ├── NotificationCenter.jsx   # Centre de notifications
│       └── Alerts.css               # Styles complets
└── contexts/
    └── AuthContext.jsx              # (déjà existant, utilisé)

docs/
├── SYSTEME_ALERTES.md              # Documentation complète
├── QUICK_START_ALERTES.md          # Guide rapide
└── ESPACE_UTILISATEUR.md           # (mis à jour)
```

### Fichiers modifiés
- `src/App.jsx` : Intégration du système d'alertes
- `src/App.css` : Styles pour le bouton notifications
- `src/components/Auth/UserProfile.jsx` : Onglet alertes

---

## 🚀 Démarrage

### 1. Installer (si nécessaire)
```bash
# Les dépendances sont déjà installées
npm install
```

### 2. Lancer l'application
```bash
npm run dev
```

### 3. Tester le système
1. **Créez un compte** ou **connectez-vous**
2. Cliquez sur votre **nom** (👤) dans le header
3. Allez dans l'onglet **"🔔 Alertes"**
4. Créez votre première alerte !

---

## 📖 Documentation

### Pour les utilisateurs
- **Guide rapide** : `docs/QUICK_START_ALERTES.md`
- **Documentation complète** : `docs/SYSTEME_ALERTES.md`
- **Espace utilisateur** : `docs/ESPACE_UTILISATEUR.md`

### Pour les développeurs
- **Service d'alertes** : Voir `src/services/alertService.js`
- **Composants** : Voir `src/components/Alerts/`
- **Tests** : À venir

---

## 🎯 Types d'alertes disponibles

| Type | Description | Exemple |
|------|-------------|---------|
| 💰 Seuil de Jackpot | Alerte quand le jackpot dépasse un montant | "Jackpot ≥ 100M€" |
| 🎯 Numéros Favoris | Alerte quand vos numéros sortent | "3 de vos numéros sont sortis" |
| 🆕 Nouveau Tirage | Alerte à chaque nouveau tirage | "Nouveau tirage EuroMillions" |
| ⭐ Numéro Chance | Alerte pour un numéro chance spécifique | "Votre étoile 7 est sortie" |

---

## 💡 Cas d'usage

### Joueur occasionnel
```javascript
Alerte: Seuil de Jackpot (100M€)
→ Notification seulement pour les gros jackpots
```

### Joueur régulier
```javascript
Alerte 1: Nouveau Tirage (EuroMillions)
Alerte 2: Numéros Favoris (vos numéros)
→ Toujours informé + suivi de vos numéros
```

### Chasseur de records
```javascript
Alerte: Seuil de Jackpot (200M€)
→ Uniquement les jackpots exceptionnels
```

---

## 🔧 API du Service

### Créer une alerte
```javascript
import { createAlert, ALERT_TYPES, GAMES } from './services/alertService'

createAlert(userId, {
  type: ALERT_TYPES.JACKPOT_THRESHOLD,
  game: GAMES.EUROMILLIONS,
  name: "Gros jackpot",
  threshold: 100000000
})
```

### Vérifier les alertes
```javascript
import { checkDrawForAlerts } from './services/alertService'

const triggered = checkDrawForAlerts(userId, draw, 'euromillions')
// Retourne un tableau de notifications déclenchées
```

### Récupérer les notifications
```javascript
import { getNotifications, getUnreadCount } from './services/alertService'

const notifs = getNotifications(userId)
const count = getUnreadCount(userId)
```

---

## 🎨 Personnalisation

### Modifier les couleurs
Éditez `src/components/Alerts/Alerts.css` :
```css
.alert-type-card.selected {
  border-color: #4361ee; /* Votre couleur */
}
```

### Modifier les préréglages de jackpot
Éditez `src/components/Alerts/AlertConfig.jsx` :
```javascript
[50, 100, 150, 200] // Montants en millions
```

### Ajouter un nouveau type d'alerte
1. Ajoutez le type dans `ALERT_TYPES` (`alertService.js`)
2. Ajoutez la logique de vérification dans `checkDrawForAlerts`
3. Ajoutez l'interface dans `AlertConfig.jsx`

---

## 📊 Performances

- **Vérification** : O(n × m) où n = alertes, m = tirages
- **Stockage** : ~5-10KB par utilisateur
- **Limite** : 50 notifications max conservées
- **Refresh** : Toutes les 5 minutes en arrière-plan

---

## 🐛 Problèmes connus

### V1.0
- [ ] Pas de modification d'alerte existante (suppression + recréation)
- [ ] Pas de notifications push (uniquement in-app)
- [ ] Pas de synchronisation multi-appareils
- [ ] Limite de 50 notifications

### Corrections prévues (V1.1)
- ✅ Édition d'alertes
- ✅ Pagination des notifications
- ✅ Export des notifications
- ✅ Historique complet

---

## 🚀 Roadmap

### Version 1.1 (Prochaine)
- [ ] Édition d'alertes
- [ ] Statistiques d'alertes
- [ ] Templates prédéfinis
- [ ] Alertes combinées (AND/OR)

### Version 2.0 (Backend)
- [ ] API REST
- [ ] Notifications email
- [ ] Notifications push web
- [ ] Synchronisation cloud

### Version 3.0 (Avancée)
- [ ] Webhooks
- [ ] Intégrations (Telegram, Discord)
- [ ] IA pour suggestions d'alertes
- [ ] Analyse prédictive

---

## 🤝 Contribution

### Comment contribuer
1. Fork le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

### Zones d'amélioration
- Tests unitaires
- Tests d'intégration
- Documentation API
- Exemples avancés
- Traductions

---

## 📞 Support

- **Documentation** : `/docs`
- **Code source** : `/src/services/alertService.js`
- **Issues** : GitHub Issues
- **Discussions** : GitHub Discussions

---

## 📜 Licence

Ce projet est sous licence MIT. Voir `LICENSE` pour plus d'informations.

---

## 🙏 Remerciements

Merci d'utiliser ce système d'alertes ! N'hésitez pas à :
- ⭐ Star le projet
- 🐛 Signaler les bugs
- 💡 Proposer des améliorations
- 📢 Partager avec d'autres

---

**Bon jeu et bonnes alertes ! 🎰🔔**

*Créé avec ❤️ pour la communauté des joueurs FDJ*

