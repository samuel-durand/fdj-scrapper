# 👤 Espace Utilisateur - Guide Complet

## 🎯 Fonctionnalités

L'application dispose maintenant d'un **espace utilisateur complet** avec :

### ✅ Authentification
- **Inscription** : Créez votre compte avec nom, email et mot de passe
- **Connexion** : Accédez à votre espace personnel
- **Déconnexion** : Sortez en toute sécurité

### ⚙️ Préférences Personnalisées
- **Jeux favoris** : Sélectionnez les jeux qui vous intéressent (EuroMillions, Loto, EuroDreams)
- **Onglet par défaut** : Choisissez quel jeu afficher en premier à l'ouverture
- **Notifications** : Activez/désactivez les notifications (fonctionnalité à venir)
- **Thème** : Votre préférence de thème (clair/sombre) est sauvegardée

---

## 🚀 Utilisation

### 1. **Inscription**
1. Cliquez sur le bouton **"Inscription"** dans le header
2. Remplissez le formulaire :
   - Nom complet
   - Email
   - Mot de passe (minimum 6 caractères)
   - Confirmation du mot de passe
3. Cliquez sur **"Créer mon compte"**
4. Vous êtes automatiquement connecté !

### 2. **Connexion**
1. Cliquez sur **"Connexion"** dans le header
2. Entrez votre email et mot de passe
3. Cliquez sur **"Se connecter"**

### 3. **Gestion du Profil**
1. Une fois connecté, cliquez sur votre nom (👤) dans le header
2. Vous accédez à votre profil avec :
   - **Informations personnelles** (nom, email, date d'inscription)
   - **Jeux favoris** : Cochez/décochez les jeux qui vous intéressent
   - **Préférences** : 
     - Sélectionnez l'onglet par défaut
     - Activez/désactivez les notifications
3. Cliquez sur **"Enregistrer les modifications"** pour sauvegarder

### 4. **Déconnexion**
1. Ouvrez votre profil (clic sur votre nom)
2. Cliquez sur **"Se déconnecter"** en bas de la fenêtre

---

## 💾 Stockage des Données

### LocalStorage
Les données sont stockées **localement** dans votre navigateur via `localStorage` :

- **`users`** : Liste de tous les utilisateurs inscrits
- **`currentUser`** : Utilisateur actuellement connecté

### Structure d'un utilisateur
```json
{
  "id": "1698765432100",
  "email": "jean@example.com",
  "name": "Jean Dupont",
  "preferences": {
    "favoriteGames": ["euromillions", "loto", "eurodreams"],
    "defaultTab": "euromillions",
    "notifications": true,
    "theme": "light"
  },
  "createdAt": "2024-10-28T12:00:00.000Z"
}
```

### ⚠️ Important
- Les données sont stockées **uniquement sur votre appareil**
- Si vous videz le cache du navigateur, vos données seront perdues
- Pas de synchronisation entre appareils (pour le moment)

---

## 🔐 Sécurité

### Version Actuelle (v1.0)
- ✅ Stockage local sécurisé dans le navigateur
- ✅ Validation des formulaires (email, mot de passe)
- ⚠️ Mot de passe stocké en texte brut dans localStorage (acceptable pour une app locale)

### Améliorations Futures
- 🔄 Backend avec base de données réelle (MongoDB, PostgreSQL)
- 🔄 Hashage des mots de passe (bcrypt)
- 🔄 JWT pour l'authentification
- 🔄 Réinitialisation de mot de passe
- 🔄 Authentification à deux facteurs (2FA)
- 🔄 OAuth (Google, Facebook)

---

## 🎨 Composants Créés

### 1. **AuthContext** (`src/contexts/AuthContext.jsx`)
Gère l'état global de l'authentification :
- `user` : Utilisateur connecté
- `login()` : Connexion
- `register()` : Inscription
- `logout()` : Déconnexion
- `updatePreferences()` : Mise à jour des préférences

### 2. **Login** (`src/components/Auth/Login.jsx`)
Formulaire de connexion avec :
- Validation des champs
- Gestion des erreurs
- Switch vers inscription

### 3. **Register** (`src/components/Auth/Register.jsx`)
Formulaire d'inscription avec :
- Validation complète
- Vérification de la confirmation du mot de passe
- Switch vers connexion

### 4. **UserProfile** (`src/components/Auth/UserProfile.jsx`)
Profil utilisateur avec :
- Affichage des informations
- Gestion des jeux favoris
- Configuration des préférences
- Bouton de déconnexion

### 5. **Auth.css** (`src/components/Auth/Auth.css`)
Styles complets pour tous les composants d'authentification

---

## 🎯 Préférences Appliquées

### 1. **Onglet par défaut**
Lorsque vous définissez un onglet par défaut :
- L'application s'ouvre automatiquement sur cet onglet
- Appliqué à chaque visite

### 2. **Jeux favoris**
- Prépare le terrain pour de futures fonctionnalités :
  - Filtres personnalisés
  - Notifications ciblées
  - Dashboard personnalisé

### 3. **Thème**
- Synchronisé avec le bouton de toggle
- Sauvegardé dans les préférences utilisateur

---

## 📱 Responsive

Toute l'interface utilisateur est **100% responsive** :
- ✅ Desktop (1920px+)
- ✅ Tablette (768px - 1024px)
- ✅ Mobile (320px - 767px)

Les modales s'adaptent automatiquement à la taille de l'écran.

---

## 🚀 Prochaines Étapes

### Version 2.0 (Backend)
1. **API REST** avec Node.js/Express
2. **Base de données** MongoDB ou PostgreSQL
3. **JWT** pour l'authentification
4. **Hashage** des mots de passe avec bcrypt

### Version 3.0 (Fonctionnalités Avancées)
1. **Notifications push** pour les nouveaux tirages
2. **Numéros favoris** : Enregistrez vos combinaisons
3. **Historique** : Consultez vos anciens numéros
4. **Statistiques personnalisées** : Analysez vos chances
5. **Alertes jackpot** : Notifications quand le jackpot dépasse un montant

---

## 🐛 Débogage

### Problème : "Impossible de se connecter"
1. Vérifiez que vous avez bien créé un compte
2. Vérifiez votre email/mot de passe
3. Ouvrez la console (F12) pour voir les erreurs

### Problème : "Mes données ont disparu"
- Vous avez probablement vidé le cache du navigateur
- Créez un nouveau compte

### Vider les données manuellement
Ouvrez la console du navigateur (F12) et exécutez :
```javascript
localStorage.removeItem('users')
localStorage.removeItem('currentUser')
location.reload()
```

---

## 📞 Support

Pour toute question ou suggestion :
1. Ouvrez une issue sur GitHub
2. Consultez la documentation complète dans `/docs`

---

**Créé avec ❤️ pour améliorer votre expérience FDJ**

