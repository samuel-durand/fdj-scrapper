@echo off
cls
echo ============================================
echo    PUSH VERS GITHUB
echo ============================================
echo.

echo Repository: https://github.com/samuel-durand/scrapping-fdj
echo.
echo Pushing vers GitHub...
echo.

git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ============================================
    echo    PUSH REUSSI !
    echo ============================================
    echo.
    echo Repository disponible sur :
    echo https://github.com/samuel-durand/scrapping-fdj
    echo.
) else (
    echo ============================================
    echo    ERREUR LORS DU PUSH
    echo ============================================
    echo.
    echo Verifiez que :
    echo 1. Le repository existe sur GitHub
    echo 2. Vous etes connecte avec vos identifiants
    echo 3. Vous avez les droits d'acces
    echo.
)

pause

