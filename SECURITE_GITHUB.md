# 🔐 SÉCURITÉ GITHUB - IMPORTANT

## ⚠️ RÈGLES DE SÉCURITÉ ABSOLUES

### ❌ NE JAMAIS FAIRE

1. **NE JAMAIS** mettre un token GitHub dans un fichier
2. **NE JAMAIS** commiter un token ou mot de passe
3. **NE JAMAIS** partager un token publiquement

### ✅ BONNES PRATIQUES

1. ✅ Utiliser des variables d'environnement
2. ✅ Demander le token à chaque utilisation
3. ✅ Révoquer les tokens compromis immédiatement

---

## 🚨 SI VOUS AVEZ EXPOSÉ UN TOKEN

### Étapes d'urgence :

1. **Révoquer le token immédiatement**
   - Aller sur https://github.com/settings/tokens
   - Trouver le token exposé
   - Cliquer "Delete" ou "Revoke"

2. **Vérifier si le token a été utilisé**
   - GitHub → Settings → Security log
   - Chercher des activités suspectes

3. **Créer un nouveau token**
   - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token
   - Sélectionner les scopes nécessaires : `repo`, `workflow`
   - Copier le token (vous ne le verrez qu'une fois !)
   - Le sauvegarder dans un gestionnaire de mots de passe (1Password, Bitwarden, etc.)

---

## 🔑 Créer un Token GitHub

### Étape 1 : Aller sur GitHub
https://github.com/settings/tokens

### Étape 2 : Generate new token (classic)

### Étape 3 : Configurer le token
- **Note** : "Loterie FDJ - Dev"
- **Expiration** : 90 days (recommandé)
- **Scopes** :
  - ✅ `repo` (Full control of private repositories)
  - ✅ `workflow` (Update GitHub Action workflows)

### Étape 4 : Generate token

### Étape 5 : COPIER LE TOKEN
⚠️ Vous ne le verrez qu'une seule fois !

---

## 💡 Utiliser le Token de Manière Sécurisée

### Option 1 : Variable d'Environnement (Recommandé)

```bash
# Dans Git Bash
export GITHUB_TOKEN="votre_token_ici"

# Puis utiliser dans les commandes
git push https://$GITHUB_TOKEN@github.com/username/repo.git
```

### Option 2 : GitHub CLI (gh)

```bash
# Installer GitHub CLI
winget install GitHub.cli

# Se connecter
gh auth login

# Créer un repo
gh repo create scrapping-fdj --public --source=. --push
```

### Option 3 : Git Credential Manager (Recommandé pour Windows)

Git Credential Manager stocke vos credentials de manière sécurisée.

```bash
# Déjà installé avec Git for Windows
# Il demandera vos identifiants une fois et les sauvegardera
git push
```

---

## 🛡️ Vérifier si un Token est dans Git

```bash
# Vérifier l'historique Git
git log --all --full-history --source --all -- '*token*'

# Chercher dans tous les fichiers
git grep -i "ghp_"

# Si trouvé, utiliser git-filter-repo pour nettoyer
```

---

## 📋 Checklist Sécurité

Avant de pusher vers GitHub :

- [ ] Aucun token dans les fichiers
- [ ] `.gitignore` configuré correctement
- [ ] Pas de mots de passe en clair
- [ ] Pas de clés API
- [ ] Pas de secrets dans le code
- [ ] Variables sensibles dans `.env` (et `.env` dans `.gitignore`)

---

## 🔒 Fichiers à Toujours Ignorer

Ajoutez dans `.gitignore` :

```gitignore
# Secrets
.env
.env.local
.env.*.local
*.key
*.pem
config/secrets.json

# Tokens
token.txt
credentials.json
```

---

## 🆘 En Cas de Fuite

1. **Révoquer** le token/secret immédiatement
2. **Changer** tous les mots de passe liés
3. **Nettoyer** l'historique Git si nécessaire
4. **Notifier** les autres développeurs
5. **Créer** de nouveaux credentials

---

## 📚 Ressources

- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [GitHub Token Security](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure)
- [Git Credential Manager](https://github.com/git-ecosystem/git-credential-manager)

---

**🔐 La sécurité est la responsabilité de tous !**

