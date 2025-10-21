# 📖 Guide Git Complet

## 🚀 Méthode Recommandée : GitHub CLI

### Installation GitHub CLI

```bash
# Windows (avec winget)
winget install GitHub.cli

# Ou télécharger depuis
# https://cli.github.com/
```

### Utilisation Ultra Simple

```bash
# 1. Se connecter à GitHub (une seule fois)
gh auth login

# 2. Créer et pousser le repo en UNE commande !
gh repo create scrapping-fdj --public --source=. --push --description "Application de scraping des résultats FDJ"
```

✨ **C'est tout !** Le repo est créé sur GitHub et poussé automatiquement !

---

## 🔧 Méthode Manuelle (Sans GitHub CLI)

### Étape 1 : Créer le Repo sur GitHub

1. Aller sur https://github.com/new
2. Nom : `scrapping-fdj`
3. Description : `Application de scraping des résultats FDJ`
4. **Public** ✅
5. **NE PAS** cocher "Add a README"
6. Cliquer "Create repository"

### Étape 2 : Dans Git Bash

```bash
# Aller dans le dossier
cd /c/Users/sam/Documents/loterie

# Initialiser Git
git init

# Configurer
git config user.name "Sam"
git config user.email "samuel.durand@laplateforme.io"

# Ajouter les fichiers
git add .

# Commit
git commit -m "🎰 Initial commit - Application Loterie FDJ"

# Branche main
git branch -M main

# Ajouter le remote
git remote add origin https://github.com/samuel-durand/scrapping-fdj.git

# Pousser
git push -u origin main
```

---

## 📝 Utilisation du Script Automatique

### create-and-push.bat

Ce script fait tout automatiquement :

1. Double-cliquer sur `create-and-push.bat`
2. Entrer votre token GitHub (sera demandé et **non sauvegardé**)
3. Attendre la fin

Le script va :
- ✅ Créer le repo sur GitHub (PUBLIC)
- ✅ Initialiser Git localement
- ✅ Faire le commit initial
- ✅ Pousser vers GitHub

---

## 🔐 Obtenir un Token GitHub

### Étapes :

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token (classic)"
3. Note : "Loterie FDJ"
4. Scopes : ✅ `repo`, ✅ `workflow`
5. Generate token
6. **COPIER** le token (vous ne le verrez qu'une fois !)

⚠️ **NE JAMAIS** le mettre dans un fichier qui sera commité !

---

## 🎯 Commandes Git Quotidiennes

### Faire des Modifications

```bash
# 1. Modifier vos fichiers...

# 2. Voir ce qui a changé
git status

# 3. Ajouter les modifications
git add .

# 4. Commit
git commit -m "✨ Description de vos changements"

# 5. Pousser vers GitHub
git push
```

### Messages de Commit

Utilisez des emojis pour clarifier :

```bash
✨ feat: Nouvelle fonctionnalité
🐛 fix: Correction de bug
📝 docs: Documentation
💄 style: Design/CSS
⚡ perf: Performance
♻️ refactor: Refactorisation
✅ test: Tests
🔧 chore: Configuration
```

### Exemples

```bash
git commit -m "✨ feat: Ajout du mode calendrier"
git commit -m "🐛 fix: Correction erreur pagination"
git commit -m "💄 style: Amélioration design modal"
git commit -m "📝 docs: Mise à jour README"
```

---

## 🌿 Branches

### Créer une Branche

```bash
# Créer et changer de branche
git checkout -b feature/nouvelle-fonctionnalite

# Faire vos modifications...

# Commit
git commit -m "✨ Nouvelle fonctionnalité"

# Pousser la branche
git push -u origin feature/nouvelle-fonctionnalite
```

### Fusionner une Branche

```bash
# Retourner sur main
git checkout main

# Fusionner
git merge feature/nouvelle-fonctionnalite

# Pousser
git push
```

---

## 🔄 Récupérer les Modifications

```bash
# Récupérer les dernières modifications
git pull

# Voir les différences
git diff

# Voir l'historique
git log --oneline
```

---

## 🛠️ Commandes Utiles

### Annuler des Modifications

```bash
# Annuler les modifications d'un fichier
git checkout -- fichier.txt

# Annuler tous les changements non commités
git reset --hard

# Annuler le dernier commit (garder les modifications)
git reset --soft HEAD~1

# Annuler le dernier commit (supprimer les modifications)
git reset --hard HEAD~1
```

### Voir l'État

```bash
# État actuel
git status

# Historique
git log

# Historique simplifié
git log --oneline --graph --all

# Différences
git diff
```

### Branches

```bash
# Voir toutes les branches
git branch -a

# Supprimer une branche locale
git branch -d nom-branche

# Supprimer une branche distante
git push origin --delete nom-branche
```

---

## 📦 .gitignore

Fichiers à toujours ignorer :

```gitignore
# Dépendances
node_modules/

# Build
dist/
build/

# Environnement
.env
.env.local

# Secrets
*.key
*.pem
token.txt
credentials.json

# OS
.DS_Store
Thumbs.db
```

---

## 🎓 Workflow Complet

### Démarrage d'un Nouveau Projet

```bash
# 1. Créer le dossier
mkdir mon-projet
cd mon-projet

# 2. Initialiser npm (si Node.js)
npm init -y

# 3. Créer .gitignore
echo "node_modules/" > .gitignore

# 4. Initialiser Git
git init

# 5. Premier commit
git add .
git commit -m "🎰 Initial commit"

# 6. Créer repo sur GitHub avec gh CLI
gh repo create mon-projet --public --source=. --push
```

### Workflow Quotidien

```bash
# Matin : Récupérer les dernières modifications
git pull

# Travail : Faire vos modifications...

# Soir : Pousser vos changements
git add .
git commit -m "✨ Description"
git push
```

---

## 🆘 Dépannage

### Problème : "fatal: not a git repository"
**Solution** : Vous n'êtes pas dans un dossier Git
```bash
git init
```

### Problème : "rejected - non-fast-forward"
**Solution** : Récupérer les modifications d'abord
```bash
git pull --rebase
git push
```

### Problème : "Permission denied (publickey)"
**Solution** : Configurer SSH ou utiliser HTTPS
```bash
git remote set-url origin https://github.com/username/repo.git
```

### Problème : "Merge conflict"
**Solution** : Résoudre manuellement
```bash
# 1. Ouvrir les fichiers en conflit
# 2. Chercher <<<<<<< HEAD
# 3. Choisir quelle version garder
# 4. Supprimer les marqueurs de conflit
# 5. Commit
git add .
git commit -m "🔀 Résolution conflit"
```

---

## 📚 Ressources

- [GitHub CLI](https://cli.github.com/)
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Oh My Git! (Jeu pour apprendre)](https://ohmygit.org/)

---

**🚀 Bon codage avec Git !**

