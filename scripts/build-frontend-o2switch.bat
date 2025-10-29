@echo off
chcp 65001 >nul
echo.
echo ════════════════════════════════════════════════════
echo    📦 BUILD FRONTEND POUR O2SWITCH
echo ════════════════════════════════════════════════════
echo.

cd ..

echo 📝 Vérification de .env.production...
if not exist .env.production (
    echo.
    echo ⚠️  .env.production n'existe pas !
    echo    Création du fichier...
    echo.
    
    (
        echo # Configuration Production
        echo VITE_API_URL=https://api.resultat-fdj.soqe8286.odns.fr/api
        echo.
        echo # OU si backend sur Render directement :
        echo # VITE_API_URL=https://ton-backend.onrender.com/api
    ) > .env.production
    
    echo ✅ .env.production créé !
    echo.
    echo ⚠️  IMPORTANT : Vérifier l'URL de l'API dans .env.production
    pause
)

echo ✅ .env.production trouvé
echo.

echo 🏗️  Build du frontend React...
echo.
call npm run build

if errorlevel 1 (
    echo.
    echo ❌ Erreur lors du build !
    pause
    exit /b 1
)

echo.
echo ════════════════════════════════════════════════════
echo    ✅ BUILD TERMINÉ AVEC SUCCÈS !
echo ════════════════════════════════════════════════════
echo.
echo 📁 Dossier créé : dist\
echo.
echo 📂 Contenu à uploader sur o2switch :
dir dist\ /b
echo.
echo ════════════════════════════════════════════════════
echo    📤 PROCHAINE ÉTAPE : UPLOAD FTP
echo ════════════════════════════════════════════════════
echo.
echo Serveur FTP  : ftp.soqe8286.odns.fr
echo Dossier      : /resultat-fdj.soqe8286.odns.fr/
echo.
echo Fichiers à uploader :
echo   • dist\index.html
echo   • dist\assets\* (tout le dossier)
echo   • dist\resultats-cache.json (si présent)
echo.
pause

