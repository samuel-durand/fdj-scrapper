@echo off
chcp 65001 >nul
echo.
echo ════════════════════════════════════════════════════
echo    🏗️  BUILD COMPLET - FRONTEND + BACKEND
echo ════════════════════════════════════════════════════
echo.
echo Ce script va :
echo   1. Créer le fichier .env.production
echo   2. Builder le frontend React
echo   3. Préparer le backend pour servir le frontend
echo.
pause

cd ..

echo.
echo ════════════════════════════════════════════════════
echo    🚀 LANCEMENT DU BUILD...
echo ════════════════════════════════════════════════════
echo.

npm run build:all

echo.
echo ════════════════════════════════════════════════════
echo    ✅ BUILD TERMINÉ !
echo ════════════════════════════════════════════════════
echo.
echo 📦 Structure créée :
echo    dist\          → Frontend buildé
echo    backend\       → Backend Node.js
echo.
echo 🧪 TESTER EN LOCAL :
echo    cd backend
echo    set NODE_ENV=production
echo    npm start
echo    → Ouvrir http://localhost:5000
echo.
echo 🚀 DÉPLOYER SUR RENDER :
echo    1. Push sur GitHub
echo    2. Render déploie automatiquement
echo    3. Une seule URL pour tout !
echo.
pause

