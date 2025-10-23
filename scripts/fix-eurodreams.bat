@echo off
chcp 65001 > nul
echo.
echo ╔════════════════════════════════════════════╗
echo ║   🔧 CORRECTION JACKPOTS EURODREAMS      ║
echo ╚════════════════════════════════════════════╝
echo.

cd ..
node utils/fix-eurodreams-jackpot.js

echo.
pause

