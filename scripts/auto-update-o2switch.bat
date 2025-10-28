@echo off
chcp 65001 > nul
echo.
echo ╔════════════════════════════════════════════╗
echo ║   🤖 AUTO-UPDATE O2SWITCH                 ║
echo ║   (Upload automatique via WinSCP)         ║
echo ╚════════════════════════════════════════════╝
echo.

cd ..

REM Vérifier que WinSCP est installé
if not exist "C:\Program Files (x86)\WinSCP\WinSCP.com" (
    echo ❌ WinSCP n'est pas installé !
    echo.
    echo 📥 Télécharge WinSCP : https://winscp.net/
    echo    Puis configure upload-o2switch.txt avec tes identifiants
    echo.
    pause
    exit /b 1
)

REM Vérifier que le script de config existe
if not exist "upload-o2switch.txt" (
    echo ❌ Fichier upload-o2switch.txt introuvable !
    echo.
    echo 📝 Crée ce fichier avec tes identifiants o2switch
    echo    (voir DEPLOIEMENT-O2SWITCH.md)
    echo.
    pause
    exit /b 1
)

echo 📊 Étape 1/4 : Scraping des résultats...
node scraper-urls-directes.js 0.5
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du scraping
    pause
    exit /b 1
)
echo ✅ Scraping terminé
echo.

echo 📦 Étape 2/4 : Copie dans dist...
copy resultats-cache.json dist\ /Y
echo ✅ Fichier copié
echo.

echo 🌐 Étape 3/4 : Upload vers o2switch...
"C:\Program Files (x86)\WinSCP\WinSCP.com" /script=upload-o2switch.txt
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de l'upload
    echo.
    echo 💡 Vérifications :
    echo    1. Tes identifiants dans upload-o2switch.txt sont corrects
    echo    2. Tu es connecté à Internet
    echo    3. Le serveur o2switch est accessible
    echo.
    pause
    exit /b 1
)
echo ✅ Upload terminé
echo.

echo ✅ Étape 4/4 : Mise à jour complète !
echo.
echo 🌐 Ton site est maintenant à jour sur o2switch
echo 📊 Vérifie : http://resultat-fdj.soqe8286.odns.fr/
echo.

pause

