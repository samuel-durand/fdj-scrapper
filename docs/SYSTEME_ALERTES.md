# 🔔 Système d'Alertes Personnalisées - Documentation Complète

## 🎯 Vue d'ensemble

Le système d'alertes permet aux utilisateurs de recevoir des **notifications personnalisées** lorsque des tirages correspondent à leurs critères spécifiques. C'est une fonctionnalité puissante pour ne jamais manquer les informations importantes !

---

## ✨ Fonctionnalités

### 4 Types d'Alertes

#### 1. 💰 **Seuil de Jackpot**
- Recevez une notification quand le jackpot dépasse un montant défini
- **Exemple** : "Le jackpot EuroMillions atteint 150M€ !"
- Préréglages : 50M€, 100M€, 150M€, 200M€ ou montant personnalisé

#### 2. 🎯 **Numéros Favoris**
- Soyez alerté quand vos numéros favoris sortent
- **Exemple** : "3 de vos numéros favoris sont sortis : 7, 15, 23 !"
- Sélectionnez vos numéros et le nombre minimum de correspondances

#### 3. 🆕 **Nouveau Tirage**
- Notification à chaque nouveau tirage disponible
- **Exemple** : "Nouveau tirage LOTO disponible !"
- Idéal pour rester informé en temps réel

#### 4. ⭐ **Numéro Chance**
- Alerte quand votre numéro chance sort
- **Exemple** : "Votre numéro chance 7 est sorti !"
- Pour EuroMillions (étoiles) ou Loto (numéro chance)

---

## 🚀 Guide d'utilisation

### Créer une alerte

1. **Connectez-vous** à votre compte
2. Cliquez sur votre **nom (👤)** dans le header
3. Sélectionnez l'onglet **"🔔 Alertes"**
4. Cliquez sur **"➕ Créer une alerte"**

### Configuration en 3 étapes

#### Étape 1 : Type d'alerte
Choisissez parmi les 4 types d'alertes disponibles

#### Étape 2 : Configuration
- **Sélectionnez le jeu** (EuroMillions, Loto ou EuroDreams)
- **Configurez les critères** selon le type :
  - Seuil de jackpot → Montant minimum
  - Numéros favoris → Sélection des numéros + correspondances min
  - Nouveau tirage → Pas de configuration supplémentaire
  - Numéro chance → Votre numéro (1-12 pour EM, 1-10 pour Loto)

#### Étape 3 : Nom
Donnez un nom à votre alerte pour la retrouver facilement

---

## 📊 Gestion des alertes

### Activer/Désactiver
- Utilisez l'**interrupteur** à côté de chaque alerte
- Une alerte désactivée ne déclenchera pas de notifications

### Supprimer
- Cliquez sur **"🗑️ Supprimer"** sur une alerte
- Confirmation demandée pour éviter les suppressions accidentelles

### Modifier
- Actuellement, pour modifier une alerte, supprimez-la et recréez-la
- Fonctionnalité de modification directe à venir

---

## 🔔 Centre de Notifications

### Accéder aux notifications
- Cliquez sur l'**icône 🔔** dans le header
- Un **badge rouge** indique le nombre de notifications non lues

### Filtres
- **Toutes** : Affiche toutes les notifications
- **Non lues** : Uniquement les nouvelles notifications

### Actions
- **Marquer comme lu** : Marque une notification individuelle comme lue
- **Tout effacer** : Supprime toutes les notifications

### Informations affichées
- **Message** de l'alerte
- **Jeu** concerné (icône + nom)
- **Date** du tirage
- **Numéros tirés** (si applicable)
- **Heure** de réception

---

## ⚙️ Fonctionnement Technique

### Vérification automatique
Le système vérifie automatiquement les nouveaux tirages :
- **Au chargement** de l'application
- **Toutes les 5 minutes** en arrière-plan
- **Après connexion** de l'utilisateur

### Stockage
Toutes les données sont stockées en **localStorage** :
- `alerts_{userId}` : Liste des alertes de l'utilisateur
- `notifications_{userId}` : Notifications reçues (max 50)
- `last_check_{userId}` : Timestamp de dernière vérification

### Processus de vérification

```javascript
1. Récupérer les nouveaux tirages depuis la dernière vérification
2. Pour chaque tirage :
   - Récupérer les alertes actives de l'utilisateur
   - Vérifier si les critères sont remplis
   - Si oui → Créer une notification
3. Sauvegarder les notifications
4. Mettre à jour le compteur
```

---

## 💡 Exemples d'utilisation

### Exemple 1 : Gros jackpot EuroMillions
```
Type: Seuil de Jackpot
Jeu: EuroMillions
Seuil: 100 000 000 €
Nom: "Gros jackpot EuroMillions"
```
**Résultat** : Notification dès que le jackpot EuroMillions dépasse 100M€

### Exemple 2 : Mes numéros porte-bonheur
```
Type: Numéros Favoris
Jeu: Loto
Numéros: 7, 13, 23, 27, 42
Correspondances min: 3
Nom: "Mes numéros porte-bonheur"
```
**Résultat** : Notification si au moins 3 de ces numéros sortent

### Exemple 3 : Alerte nouveaux tirages
```
Type: Nouveau Tirage
Jeu: EuroMillions
Nom: "Nouveaux tirages EuroMillions"
```
**Résultat** : Notification à chaque nouveau tirage EuroMillions

### Exemple 4 : Mon étoile chanceuse
```
Type: Numéro Chance
Jeu: EuroMillions
Numéro: 7
Nom: "Mon étoile 7"
```
**Résultat** : Notification quand l'étoile 7 sort à l'EuroMillions

---

## 📱 Interface utilisateur

### Badge de notification
- **Position** : À côté du bouton utilisateur dans le header
- **Couleur** : Rouge avec gradient
- **Animation** : Pulsation pour attirer l'attention
- **Nombre** : Affiche le nombre de notifications non lues

### Design
- **Moderne** : Interface épurée et intuitive
- **Responsive** : S'adapte à tous les écrans
- **Animations** : Transitions fluides
- **Accessibilité** : Contrastes optimisés

---

## 🎨 Composants créés

### 1. **alertService.js**
Service principal de gestion des alertes
- Création/modification/suppression d'alertes
- Vérification des tirages
- Gestion des notifications
- Templates prédéfinis

### 2. **AlertConfig.jsx**
Assistant de création d'alertes en 3 étapes
- Interface guidée
- Validation des données
- Prévisualisation

### 3. **NotificationCenter.jsx**
Centre de notifications
- Affichage des notifications
- Filtres (toutes/non lues)
- Actions (marquer lu, effacer)

### 4. **AlertsList.jsx**
Liste des alertes configurées
- Affichage de toutes les alertes
- Toggle activer/désactiver
- Suppression

### 5. **Alerts.css**
Styles complets pour tous les composants

---

## 🔮 Évolution future

### Version 2.0
- [ ] Modification d'alertes existantes
- [ ] Alertes par email
- [ ] Notifications push (web push)
- [ ] Historique détaillé des déclenchements
- [ ] Statistiques des alertes

### Version 3.0
- [ ] Alertes complexes (conditions multiples)
- [ ] Planification d'alertes (horaires spécifiques)
- [ ] Partage d'alertes entre utilisateurs
- [ ] Templates d'alertes prédéfinis
- [ ] Export des notifications en PDF

### Version 4.0 (Backend)
- [ ] Synchronisation cloud
- [ ] Notifications SMS
- [ ] Intégration Telegram/Discord
- [ ] Webhooks personnalisés
- [ ] API REST pour les alertes

---

## 🐛 Débogage

### Problème : "Pas de notifications"
**Solutions** :
1. Vérifiez que vous avez des alertes **actives**
2. Assurez-vous que les critères sont **réalistes**
3. Vérifiez qu'il y a eu de **nouveaux tirages**
4. Ouvrez la console (F12) pour voir les logs

### Problème : "Trop de notifications"
**Solutions** :
1. **Désactivez** les alertes trop fréquentes
2. Augmentez les **seuils** (ex: jackpot plus élevé)
3. Pour numéros favoris, augmentez le **nombre min de correspondances**

### Problème : "Notifications en double"
**Solutions** :
1. Vérifiez que vous n'avez pas **plusieurs alertes similaires**
2. Videz le cache : `localStorage.clear()` dans la console
3. Actualisez la page (F5)

### Vider toutes les données d'alertes
Ouvrez la console (F12) et exécutez :
```javascript
// Remplacez USER_ID par votre ID utilisateur
const userId = "votre_id_utilisateur"
localStorage.removeItem(`alerts_${userId}`)
localStorage.removeItem(`notifications_${userId}`)
localStorage.removeItem(`last_check_${userId}`)
location.reload()
```

---

## 📊 Limites actuelles

- **Max 50 notifications** conservées (les plus anciennes sont supprimées)
- **Vérification** : Uniquement au chargement et toutes les 5 min
- **Stockage local** : Données liées à l'appareil (pas de sync)
- **Pas d'email** : Notifications uniquement dans l'app

---

## 🎓 Conseils d'utilisation

### Pour les joueurs réguliers
- Créez une alerte **"Nouveau tirage"** pour votre jeu favori
- Configurez vos **numéros porte-bonheur**
- Alerte jackpot à **50M€** pour ne rien manquer

### Pour les chasseurs de gros lots
- Alerte jackpot à **150M€+**
- Désactivez les alertes de nouveaux tirages (trop fréquentes)
- Concentrez-vous sur EuroMillions

### Pour les superstitieux
- Créez plusieurs alertes **numéro chance**
- Suivez vos **dates anniversaires** (en numéros)
- Combinez avec numéros favoris

---

## 🔐 Sécurité et confidentialité

- ✅ Données stockées **localement** (pas de serveur)
- ✅ Aucune donnée envoyée à l'extérieur
- ✅ Code source **open source** et vérifiable
- ⚠️ Sauvegardez vos alertes si vous videz le cache

---

## 📞 Support

Pour toute question ou suggestion :
- **GitHub Issues** : Ouvrez une issue
- **Documentation** : Consultez `/docs`
- **Code** : Explorez `/src/services/alertService.js`

---

## 🎉 Résumé

Le système d'alertes personnalisées vous permet de :
- ✅ Ne **jamais manquer** un gros jackpot
- ✅ Être notifié quand **vos numéros** sortent
- ✅ Rester **informé** en temps réel
- ✅ **Personnaliser** votre expérience
- ✅ Gérer facilement vos **préférences**

**Créez votre première alerte dès maintenant ! 🚀**

---

*Dernière mise à jour : Octobre 2024*

