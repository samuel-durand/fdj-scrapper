@echo off
chcp 65001 > nul
color 0B
echo.
echo ════════════════════════════════════════════════════════════
echo     🚀 DÉPLOIEMENT O2SWITCH - SIMPLE ET RAPIDE
echo ════════════════════════════════════════════════════════════
echo.

cd ..

echo 📊 Étape 1/2 : Récupération des derniers résultats FDJ...
echo.
node scraper-urls-directes.js 0.1
if %errorlevel% neq 0 (
    echo.
    echo ❌ Erreur lors du scraping
    pause
    exit /b 1
)

echo.
echo ✅ Résultats récupérés !
echo.

echo 📦 Étape 2/2 : Copie dans le dossier dist...
copy resultats-cache.json dist\ /Y > nul
echo ✅ Fichier copié !

echo.
echo ════════════════════════════════════════════════════════════
echo     ✅ PRÊT POUR O2SWITCH !
echo ════════════════════════════════════════════════════════════
echo.
echo 📁 Le dossier dist\ contient tout ce dont tu as besoin
echo.
echo 🌐 UPLOAD SUR O2SWITCH :
echo.
echo    1. Ouvre FileZilla
echo    2. Connecte-toi à ton serveur o2switch
echo    3. Upload SEULEMENT le fichier :
echo.
echo       👉 dist\resultats-cache.json
echo.
echo    4. Destination : /www/
echo.
echo ════════════════════════════════════════════════════════════
echo.
echo 💡 TU AS WINSCP ? Tape 'W' pour upload automatique
echo 💡 Sinon, tape ENTRÉE pour ouvrir le dossier dist\
echo.
choice /C WE /N /M "Ton choix (W=WinSCP, ENTRÉE=Ouvrir dossier): "

if %errorlevel% EQU 1 (
    echo.
    echo 🌐 Upload automatique avec WinSCP...
    if not exist "C:\Program Files (x86)\WinSCP\WinSCP.com" (
        echo ❌ WinSCP n'est pas installé
        echo 📥 Télécharge-le : https://winscp.net/
        echo.
        echo 📁 Ouverture du dossier dist\ à la place...
        explorer dist
    ) else (
        if not exist "upload-o2switch.txt" (
            echo ❌ Fichier de config upload-o2switch.txt introuvable
            echo 📝 Configure-le d'abord avec tes identifiants o2switch
            echo.
            echo 📁 Ouverture du dossier dist\ à la place...
            explorer dist
        ) else (
            "C:\Program Files (x86)\WinSCP\WinSCP.com" /script=upload-o2switch.txt
            if %errorlevel% EQU 0 (
                echo.
                echo ✅✅✅ UPLOAD RÉUSSI ! ✅✅✅
                echo.
                echo 🌐 Ton site o2switch est maintenant à jour !
                echo 📊 Vérifie : http://ton-domaine.com
            ) else (
                echo.
                echo ❌ Erreur lors de l'upload
                echo 💡 Vérifie tes identifiants dans upload-o2switch.txt
            )
        )
    )
) else (
    echo.
    echo 📁 Ouverture du dossier dist\...
    explorer dist
)

echo.
echo ════════════════════════════════════════════════════════════
pause

