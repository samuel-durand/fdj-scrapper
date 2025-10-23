@echo off
echo ========================================
echo   Redemarrage des serveurs
echo ========================================
echo.
echo Arret des processus Node.js en cours...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo.
echo Demarrage du proxy...
start "Proxy FDJ" cmd /k node server-proxy-example.js
timeout /t 2 /nobreak >nul
echo.
echo Demarrage de l'application...
start "Application Loterie" cmd /k npm run dev
echo.
echo ========================================
echo   Serveurs redemarres !
echo ========================================
echo.
echo   Proxy:       http://localhost:3001
echo   Application: http://localhost:5173
echo.
pause

