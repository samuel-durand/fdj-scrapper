@echo off
REM ════════════════════════════════════════════════════════════
REM Lanceur pour le script PowerShell de configuration
REM ════════════════════════════════════════════════════════════

echo.
echo ════════════════════════════════════════════════════════════
echo   🤖 CONFIGURATION TÂCHE PLANIFIÉE WINDOWS
echo ════════════════════════════════════════════════════════════
echo.
echo Ce script va configurer une tâche planifiée Windows
echo pour mettre à jour automatiquement ton site o2switch
echo tous les jours à 22h.
echo.
echo ⚠️  IMPORTANT : Nécessite les droits administrateur !
echo.
pause

REM Lancer PowerShell en admin
powershell -ExecutionPolicy Bypass -File "%~dp0configurer-tache-planifiee.ps1"

pause

