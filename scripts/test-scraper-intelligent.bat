@echo off
chcp 65001 >nul
echo.
echo ════════════════════════════════════════════════════
echo    🧪 TEST DU SCRAPER INTELLIGENT
echo ════════════════════════════════════════════════════
echo.
echo 📅 Ce script va tester le scraper qui ne scrape QUE
echo    les tirages du jour actuel (pas 7 jours).
echo.
echo ⚡ Avantages :
echo    • 95%% plus rapide (5-10s au lieu de 2-3 min)
echo    • Scrape uniquement les nouveaux tirages
echo    • Moins de charge sur le serveur FDJ
echo.
pause

echo.
echo ════════════════════════════════════════════════════
echo    🚀 LANCEMENT DU SCRAPER...
echo ════════════════════════════════════════════════════
echo.

cd ..
node scraper-tirage-du-jour.js

echo.
echo ════════════════════════════════════════════════════
echo    ✅ TEST TERMINÉ !
echo ════════════════════════════════════════════════════
echo.
echo 📁 Le fichier resultats-cache.json a été mis à jour.
echo.
echo 💡 Astuce :
echo    • Dimanche : Aucun tirage (le scraper ne fait rien)
echo    • Lundi : Scrape Loto + EuroDreams
echo    • Mardi : Scrape EuroMillions
echo    • Mercredi : Scrape Loto
echo    • Jeudi : Scrape EuroDreams
echo    • Vendredi : Scrape EuroMillions
echo    • Samedi : Scrape Loto
echo.
pause

