@echo off
cls
echo ============================================
echo    CREATION REPOSITORY GIT - LOTERIE FDJ
echo ============================================
echo.

REM Configuration Git
echo [1/6] Configuration Git...
git config user.name "Sam"
git config user.email "samuel.durand@laplateforme.io"
echo ✓ Configuration terminee

echo.
echo [2/6] Initialisation du repository...
git init
echo ✓ Repository initialise

echo.
echo [3/6] Ajout des fichiers...
git add .
echo ✓ Fichiers ajoutes

echo.
echo [4/6] Creation du commit initial...
git commit -m "🎰 Initial commit - Application Loterie FDJ"
echo ✓ Commit cree

echo.
echo [5/6] Creation de la branche main...
git branch -M main
echo ✓ Branche main creee

echo.
echo [6/6] Ajout du remote GitHub...
git remote add origin https://github.com/samuel-durand/loterie-fdj.git
echo ✓ Remote ajoute

echo.
echo ============================================
echo    REPOSITORY LOCAL CREE !
echo ============================================
echo.
echo Pour pousser vers GitHub, executez :
echo   git push -u origin main
echo.
echo Ou lancez : push-to-github.bat
echo.
pause

