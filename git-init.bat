@echo off
echo ========================================
echo   INITIALISATION GIT REPOSITORY
echo ========================================
echo.

REM Demander le nom d'utilisateur GitHub
set /p samuel-durand="Entrez votre nom d'utilisateur GitHub: "

echo.
echo Initialisation de Git...
git init

echo.
echo Configuration de Git...
git config user.name "Sam"
git config user.email "samuel.durand@laplateforme.io"

echo.
echo Ajout des fichiers...
git add .

echo.
echo Premier commit...
git commit -m "🎰 Initial commit - Application Loterie FDJ

- Interface React moderne avec design FDJ
- Scraping résultats Euromillions et Loto depuis FDJ.fr
- Pagination fonctionnelle (3 derniers mois)
- 30 tirages Euromillions + 43 tirages Loto
- Modal détails avec répartition complète des gains
- Animations fluides et responsive design
- Fond blanc épuré avec couleurs FDJ officielles"

echo.
echo Création de la branche main...
git branch -M main

echo.
echo Ajout du remote GitHub...
git remote add origin https://github.com/%USERNAME%/loterie-fdj.git

echo.
echo Push vers GitHub...
git push -u origin main

echo.
echo ========================================
echo   REPOSITORY CREE AVEC SUCCES !
echo ========================================
echo.
echo Repository: https://github.com/%USERNAME%/loterie-fdj
echo.
pause

