@echo off
REM Script pour créer un admin en mode non-interactif sur Windows

echo.
echo ========================================
echo    CREATE ADMIN - MODE NON-INTERACTIF
echo ========================================
echo.

if "%~3"=="" (
    echo Usage: create-admin.bat ^<nom^> ^<email^> ^<mot-de-passe^>
    echo.
    echo Exemple:
    echo   create-admin.bat "Admin" "admin@example.com" "password123"
    echo.
    echo OU utilisez:
    echo   npm run create-admin
    echo   pour le mode interactif
    echo.
    exit /b 1
)

echo Nom: %~1
echo Email: %~2
echo Mot de passe: %~3
echo.

cd /d "%~dp0\.."
node scripts/create-admin.js "%~1" "%~2" "%~3"

pause

