# 🔐 Panel Administrateur - Guide Complet

## 📋 Table des matières
1. [Aperçu](#aperçu)
2. [Installation](#installation)
3. [Créer un utilisateur administrateur](#créer-un-utilisateur-administrateur)
4. [Fonctionnalités du panel](#fonctionnalités-du-panel)
5. [API Routes](#api-routes)
6. [Sécurité](#sécurité)

---

## Aperçu

Le panel administrateur permet une gestion complète de la plateforme :
- 📊 **Statistiques globales** : Vue d'ensemble des utilisateurs, combinaisons et alertes
- 👥 **Gestion des utilisateurs** : CRUD complet avec recherche et filtres
- 🎲 **Gestion des combinaisons** : Consultation et suppression
- 🔔 **Gestion des alertes** : Consultation et suppression

---

## Installation

### 1. Modifications backend déjà appliquées

✅ **Modèle User** : Ajout du champ `role` ('user' ou 'admin')
✅ **Middleware** : `isAdmin` pour protéger les routes
✅ **Routes admin** : API complète `/api/admin/*`
✅ **Script de création** : `backend/scripts/create-admin.js`

### 2. Modifications frontend déjà appliquées

✅ **Service admin** : `src/services/adminService.js`
✅ **Composant AdminPanel** : `src/components/Admin/AdminPanel.jsx`
✅ **Styles** : `src/components/Admin/AdminPanel.css`
✅ **Intégration** : Bouton 🔐 dans le header (visible uniquement pour les admins)

---

## Créer un utilisateur administrateur

### Méthode 1 : Script interactif (Recommandé)

```bash
# Depuis le dossier racine du projet
cd backend
node scripts/create-admin.js
```

Le script vous demandera :
- Nom de l'administrateur
- Email
- Mot de passe (minimum 6 caractères)

**Cas spéciaux :**
- Si l'email existe déjà, le script propose de promouvoir l'utilisateur existant en admin

### Méthode 2 : Directement dans MongoDB

```javascript
// Dans MongoDB Compass ou mongo shell
db.users.updateOne(
  { email: "votre.email@exemple.com" },
  { $set: { role: "admin" } }
)
```

### Méthode 3 : Créer un admin via l'API (nécessite un admin existant)

```bash
# PUT /api/admin/users/:userId
curl -X PUT http://localhost:5000/api/admin/users/USER_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

---

## Fonctionnalités du panel

### 📊 Statistiques

**Métriques affichées :**
- Utilisateurs totaux, actifs, inactifs, nouveaux (7 jours)
- Combinaisons totales, récentes (7 jours), par jeu
- Alertes totales, actives, inactives

**Mise à jour :** Automatique à chaque ouverture

### 👥 Gestion des utilisateurs

**Fonctionnalités :**
- ✅ Recherche par nom ou email
- ✅ Affichage des statistiques (combinaisons, alertes)
- ✅ Changer le rôle (user ↔ admin)
- ✅ Activer/Désactiver un compte
- ✅ Supprimer un utilisateur (+ toutes ses données)
- ✅ Pagination automatique

**Restrictions :**
- ❌ Un admin ne peut pas modifier son propre rôle
- ❌ Un admin ne peut pas se supprimer lui-même

### 🎲 Gestion des combinaisons

**Fonctionnalités :**
- ✅ Voir toutes les combinaisons de tous les utilisateurs
- ✅ Filtrer par jeu (euromillions, loto, eurodreams)
- ✅ Voir les numéros complets
- ✅ Supprimer une combinaison
- ✅ Pagination (30 par page)

### 🔔 Gestion des alertes

**Fonctionnalités :**
- ✅ Voir toutes les alertes de tous les utilisateurs
- ✅ Filtrer par statut (actif/inactif)
- ✅ Supprimer une alerte
- ✅ Pagination (30 par page)

---

## API Routes

Toutes les routes nécessitent l'authentification (`protect`) ET les droits admin (`isAdmin`).

### Statistiques

```
GET /api/admin/stats
Réponse : {
  users: { total, active, inactive, recent },
  combinations: { total, recent, byGame: [...] },
  alerts: { total, active, inactive }
}
```

### Utilisateurs

```
GET /api/admin/users
Query params : ?page=1&limit=20&search=xxx&role=admin&isActive=true
Réponse : { data: [...], pagination: {...} }

GET /api/admin/users/:id
Réponse : { user, combinations: [...], alerts: [...] }

PUT /api/admin/users/:id
Body : { name, email, role, isActive }
Réponse : { data: updatedUser }

DELETE /api/admin/users/:id
Réponse : { message: "Utilisateur et données supprimés" }
```

### Combinaisons

```
GET /api/admin/combinations
Query params : ?page=1&limit=50&game=loto&userId=xxx
Réponse : { data: [...], pagination: {...} }

DELETE /api/admin/combinations/:id
Réponse : { message: "Combinaison supprimée" }
```

### Alertes

```
GET /api/admin/alerts
Query params : ?page=1&limit=50&userId=xxx&isActive=true
Réponse : { data: [...], pagination: {...} }

DELETE /api/admin/alerts/:id
Réponse : { message: "Alerte supprimée" }
```

---

## Sécurité

### Protection des routes

Toutes les routes admin utilisent deux middlewares :
1. **`protect`** : Vérifie l'authentification JWT
2. **`isAdmin`** : Vérifie que `user.role === 'admin'`

```javascript
router.use(protect)
router.use(isAdmin)
```

### Protection frontend

Le bouton admin est visible uniquement si :
```javascript
{user.role === 'admin' && (
  <button className="admin-btn" onClick={() => setShowAdminPanel(true)}>
    🔐
  </button>
)}
```

Le panel vérifie également le rôle :
```javascript
if (!user || user.role !== 'admin') {
  return <AccessDenied />
}
```

### Restrictions importantes

- ✅ Un admin ne peut pas modifier son propre rôle
- ✅ Un admin ne peut pas se supprimer
- ✅ Les tokens JWT expirent après 30 jours
- ✅ Les mots de passe sont hashés avec bcrypt (12 rounds)

---

## Utilisation en développement

### 1. Démarrer le backend
```bash
cd backend
npm run dev
```

### 2. Créer un admin (si pas encore fait)
```bash
node scripts/create-admin.js
```

### 3. Démarrer le frontend
```bash
npm run dev
```

### 4. Se connecter avec le compte admin
- Aller sur http://localhost:5173
- Cliquer sur "Connexion"
- Utiliser l'email et mot de passe créés

### 5. Accéder au panel
- Cliquer sur le bouton 🔐 dans le header
- Profitez de tous les pouvoirs ! 👑

---

## Dépannage

### Le bouton 🔐 n'apparaît pas

**Vérifications :**
1. L'utilisateur est-il connecté ?
2. L'utilisateur a-t-il le rôle `admin` ?
3. Vérifier dans MongoDB : `db.users.findOne({ email: "..." })`

### Erreur "Accès refusé"

**Causes possibles :**
- Le token JWT a expiré → Se reconnecter
- Le rôle a été modifié → Se déconnecter puis reconnecter
- Problème backend → Vérifier les logs du serveur

### Les statistiques ne se chargent pas

**Vérifications :**
1. Le backend est-il démarré ?
2. MongoDB est-il accessible ?
3. Vérifier la console du navigateur (F12)
4. Vérifier les logs du serveur backend

---

## Structure des fichiers

```
backend/
├── models/
│   └── User.js              # Modèle avec champ 'role'
├── middleware/
│   └── auth.js              # Middleware protect + isAdmin
├── routes/
│   └── admin.js             # Routes admin
├── scripts/
│   └── create-admin.js      # Script de création admin
└── server.js                # Intégration des routes

src/
├── components/
│   └── Admin/
│       ├── AdminPanel.jsx   # Composant principal
│       └── AdminPanel.css   # Styles
├── services/
│   └── adminService.js      # API calls
└── App.jsx                  # Intégration du bouton
```

---

## Prochaines améliorations possibles

- 📧 Envoi d'emails aux utilisateurs
- 📈 Graphiques de statistiques avancés
- 🔍 Logs d'activité admin
- 📅 Export de données CSV/Excel
- 🎨 Personnalisation de la plateforme
- 🚫 Système de bannissement
- 📊 Dashboard analytics avancé

---

## Conclusion

Le panel administrateur est maintenant opérationnel et sécurisé ! 🎉

Pour toute question ou problème, consultez les logs du serveur ou contactez le développeur.

**Bon admin ! 👑**

