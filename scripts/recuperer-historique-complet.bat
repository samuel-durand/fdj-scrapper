@echo off
echo.
echo ========================================
echo   RECUPERATION HISTORIQUE COMPLET FDJ
echo ========================================
echo.
echo Cette operation va recuperer tous les
echo tirages des 3 derniers mois (environ 65 tirages)
echo.
echo Duree estimee : 3-5 minutes
echo.
pause
echo.
echo Demarrage...
echo.

node scraper-urls-directes.js 3

echo.
echo ========================================
echo   Termine !
echo ========================================
echo.
pause

