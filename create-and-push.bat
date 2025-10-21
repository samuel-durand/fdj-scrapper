@echo off
cls
echo ============================================
echo   CREATION ET PUSH REPOSITORY GITHUB
echo ============================================
echo.

REM Demander le token GitHub de manière sécurisée
set /p GITHUB_TOKEN="Entrez votre token GitHub (ne sera pas sauvegarde): "

echo.
echo [1/8] Creation du repository sur GitHub...
curl -X POST ^
  -H "Authorization: token %GITHUB_TOKEN%" ^
  -H "Accept: application/vnd.github.v3+json" ^
  https://api.github.com/user/repos ^
  -d "{\"name\":\"scrapping-fdj\",\"description\":\"Application de scraping des résultats Euromillions et Loto depuis FDJ.fr\",\"private\":false,\"auto_init\":false}"

echo ✓ Repository cree sur GitHub

echo.
echo [2/8] Configuration Git locale...
git config user.name "Sam"
git config user.email "samuel.durand@laplateforme.io"
echo ✓ Configuration terminee

echo.
echo [3/8] Initialisation du repository local...
git init
echo ✓ Repository initialise

echo.
echo [4/8] Ajout des fichiers...
git add .
echo ✓ Fichiers ajoutes

echo.
echo [5/8] Creation du commit initial...
git commit -m "🎰 Initial commit - Application Loterie FDJ

- Interface React moderne avec design FDJ
- Scraping résultats Euromillions et Loto depuis FDJ.fr
- Pagination fonctionnelle (3 derniers mois)
- 30 tirages Euromillions + 43 tirages Loto
- Modal détails avec répartition complète des gains
- Animations fluides et responsive design
- Fond blanc épuré avec couleurs FDJ officielles"
echo ✓ Commit cree

echo.
echo [6/8] Creation de la branche main...
git branch -M main
echo ✓ Branche main creee

echo.
echo [7/8] Ajout du remote GitHub...
git remote add origin https://github.com/samuel-durand/scrapping-fdj.git
echo ✓ Remote ajoute

echo.
echo [8/8] Push vers GitHub...
git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ============================================
    echo    REPOSITORY CREE ET PUSHE AVEC SUCCES !
    echo ============================================
    echo.
    echo Repository PUBLIC disponible sur :
    echo https://github.com/samuel-durand/scrapping-fdj
    echo.
) else (
    echo ============================================
    echo    ERREUR LORS DU PUSH
    echo ============================================
    echo.
)

REM Effacer le token de la mémoire
set GITHUB_TOKEN=

pause

