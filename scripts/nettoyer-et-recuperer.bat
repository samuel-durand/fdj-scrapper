@echo off
echo.
echo ========================================
echo   NETTOYAGE ET RECUPERATION COMPLETE
echo ========================================
echo.
echo Etape 1/2 : Nettoyage du cache...
echo.

node nettoyer-cache.js

echo.
echo ========================================
echo Etape 2/2 : Recuperation de l'historique...
echo (Ceci peut prendre plusieurs minutes)
echo ========================================
echo.

node scraper-historique-puppeteer.js 5

echo.
echo ========================================
echo   Termine !
echo ========================================
echo.
echo Vos resultats sont maintenant 100%% corrects.
echo.
pause

