@echo off
chcp 65001 > nul
echo.
echo ╔════════════════════════════════════════════╗
echo ║   💤 SCRAPER EURODREAMS                   ║
echo ╚════════════════════════════════════════════╝
echo.

set /p MOIS="Combien de mois récupérer ? (défaut: 1) : "
if "%MOIS%"=="" set MOIS=1

echo.
echo 🚀 Lancement du scraper pour %MOIS% mois...
echo.

node scraper-eurodreams.js %MOIS%

echo.
echo ✅ Terminé !
echo.
pause

