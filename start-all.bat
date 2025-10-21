@echo off
echo ========================================
echo   Lancement des serveurs
echo ========================================
echo.
echo Demarrage du proxy sur le port 3001...
start "Proxy FDJ" cmd /k node server-proxy-example.js
timeout /t 2 /nobreak >nul
echo.
echo Demarrage de l'application sur le port 5173...
start "Application Loterie" cmd /k npm run dev
echo.
echo ========================================
echo   Les serveurs sont lances !
echo ========================================
echo.
echo   Proxy:       http://localhost:3001
echo   Application: http://localhost:5173
echo.
echo Appuyez sur une touche pour fermer cette fenetre...
pause >nul

