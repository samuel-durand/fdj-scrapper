# ════════════════════════════════════════════════════════════
# Configuration automatique de la tâche planifiée Windows
# Pour mise à jour automatique quotidienne sur o2switch
# ════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🤖 CONFIGURATION TÂCHE PLANIFIÉE WINDOWS" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Vérifier les droits admin
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  Ce script nécessite les droits administrateur !" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Relance ce script en tant qu'administrateur :" -ForegroundColor Yellow
    Write-Host "  1. Clique droit sur le fichier" -ForegroundColor Yellow
    Write-Host "  2. 'Exécuter avec PowerShell en tant qu'administrateur'" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host "✅ Droits administrateur OK" -ForegroundColor Green
Write-Host ""

# Chemin du projet
$projectPath = Split-Path -Parent $PSScriptRoot
$scriptPath = Join-Path $projectPath "scripts\deployer-o2switch.bat"

Write-Host "📂 Chemin du projet : $projectPath" -ForegroundColor Cyan
Write-Host "📄 Script à exécuter : $scriptPath" -ForegroundColor Cyan
Write-Host ""

# Vérifier que le script existe
if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ Erreur : Script deployer-o2switch.bat introuvable !" -ForegroundColor Red
    Write-Host "   Chemin attendu : $scriptPath" -ForegroundColor Red
    Write-Host ""
    pause
    exit 1
}

Write-Host "✅ Script trouvé" -ForegroundColor Green
Write-Host ""

# Configuration de la tâche
Write-Host "⚙️  Configuration de la tâche planifiée..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Nom : Loterie FDJ - Mise à jour o2switch" -ForegroundColor White
Write-Host "  Fréquence : Tous les jours à 22:00" -ForegroundColor White
Write-Host "  Action : Scrape + Upload automatique" -ForegroundColor White
Write-Host ""

$confirmation = Read-Host "Continuer ? (O/N)"
if ($confirmation -ne 'O' -and $confirmation -ne 'o') {
    Write-Host "❌ Annulé" -ForegroundColor Red
    pause
    exit 0
}

Write-Host ""
Write-Host "🔧 Création de la tâche planifiée..." -ForegroundColor Yellow

# Nom de la tâche
$taskName = "Loterie FDJ - Mise à jour o2switch"

# Supprimer la tâche si elle existe déjà
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "⚠️  Une tâche avec ce nom existe déjà" -ForegroundColor Yellow
    Write-Host "   Suppression de l'ancienne tâche..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "✅ Ancienne tâche supprimée" -ForegroundColor Green
}

# Créer l'action (exécuter le script .bat)
$action = New-ScheduledTaskAction `
    -Execute "cmd.exe" `
    -Argument "/c `"$scriptPath`"" `
    -WorkingDirectory $projectPath

# Créer le déclencheur (tous les jours à 22h)
$trigger = New-ScheduledTaskTrigger -Daily -At 22:00

# Créer les paramètres
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -WakeToRun

# Créer la tâche
$principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType S4U `
    -RunLevel Highest

# Enregistrer la tâche
try {
    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Description "Scrape les résultats FDJ et upload automatique vers o2switch tous les jours à 22h" `
        -ErrorAction Stop | Out-Null
    
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "  ✅ TÂCHE PLANIFIÉE CRÉÉE AVEC SUCCÈS !" -ForegroundColor Green
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Détails de la tâche :" -ForegroundColor Cyan
    Write-Host "  • Nom : $taskName" -ForegroundColor White
    Write-Host "  • Fréquence : Tous les jours à 22:00" -ForegroundColor White
    Write-Host "  • Script : $scriptPath" -ForegroundColor White
    Write-Host "  • Réveil automatique : Oui" -ForegroundColor White
    Write-Host "  • Fonctionne sur batterie : Oui" -ForegroundColor White
    Write-Host ""
    Write-Host "🎯 Ce qui va se passer :" -ForegroundColor Cyan
    Write-Host "  1. Tous les soirs à 22h (après les tirages)" -ForegroundColor White
    Write-Host "  2. Ton PC se réveillera (même en veille)" -ForegroundColor White
    Write-Host "  3. Scraping des résultats FDJ" -ForegroundColor White
    Write-Host "  4. Upload automatique vers o2switch" -ForegroundColor White
    Write-Host "  5. Ton site est à jour !" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Vérification :" -ForegroundColor Yellow
    Write-Host "  → Ouvre 'Planificateur de tâches' Windows" -ForegroundColor White
    Write-Host "  → Cherche : $taskName" -ForegroundColor White
    Write-Host "  → Clique droit → 'Exécuter' pour tester" -ForegroundColor White
    Write-Host ""
    
    # Proposer de tester maintenant
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    $testNow = Read-Host "Veux-tu tester l'exécution maintenant ? (O/N)"
    
    if ($testNow -eq 'O' -or $testNow -eq 'o') {
        Write-Host ""
        Write-Host "🧪 Lancement du test..." -ForegroundColor Yellow
        Write-Host ""
        Start-ScheduledTask -TaskName $taskName
        Write-Host "✅ Tâche lancée !" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Vérifie que le script s'exécute correctement" -ForegroundColor Cyan
        Write-Host "   (Une fenêtre devrait s'ouvrir)" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ ERREUR lors de la création de la tâche !" -ForegroundColor Red
    Write-Host "   Détails : $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    pause
    exit 1
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  🎉 CONFIGURATION TERMINÉE !" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
pause

