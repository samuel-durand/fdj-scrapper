# 🔧 Scripts Batch Windows

Ce dossier contient tous les scripts `.bat` pour faciliter l'utilisation de l'application sur Windows.

## 🚀 Scripts de démarrage

### Applications
- **`start-app.bat`** - Lance uniquement l'application React (Vite)
- **`start-proxy.bat`** - Lance uniquement le serveur proxy
- **`start-scheduler.bat`** - Lance le planificateur de mises à jour
- **`start-all.bat`** - Lance tous les serveurs ensemble
- **`start-complet.bat`** - Démarrage complet (tout en un)
- **`restart-servers.bat`** - Redémarre tous les serveurs

## 📊 Scripts de scraping

### Scraping des résultats
- **`scrape-eurodreams.bat`** - Scrape uniquement EuroDreams (interactif)
- **`recuperer-historique-complet.bat`** - Récupère l'historique complet (3 jeux)
- **`update-resultats.bat`** - Met à jour les résultats récents
- **`update-resultats-puppeteer.bat`** - Met à jour avec Puppeteer

### Maintenance
- **`nettoyer-et-recuperer.bat`** - Nettoie le cache et récupère de nouvelles données
- **`fix-eurodreams.bat`** - Corrige les jackpots EuroDreams erronés

## 🔄 Scripts Git

### GitHub
- **`git-init.bat`** - Initialise le dépôt Git
- **`create-repo.bat`** - Crée un nouveau dépôt GitHub
- **`push-to-github.bat`** - Push les changements sur GitHub
- **`create-and-push.bat`** - Crée le dépôt et push

## 📋 Utilisation

Double-cliquez sur le script `.bat` de votre choix, ou exécutez-le depuis le terminal :

```bash
# Depuis la racine du projet
.\scripts\start-app.bat

# Ou directement si vous êtes dans le dossier scripts
.\start-app.bat
```

## ⚙️ Configuration

Certains scripts peuvent demander des paramètres (nombre de mois, etc.). Ils vous guideront de manière interactive.

## 🆘 Aide

Si un script ne fonctionne pas :
1. Vérifiez que Node.js est installé (`node --version`)
2. Vérifiez que les dépendances sont installées (`npm install`)
3. Consultez la documentation dans [../docs/](../docs/)

---

[⬅️ Retour à la racine](../)

