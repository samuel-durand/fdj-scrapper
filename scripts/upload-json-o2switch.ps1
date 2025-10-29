# Script d'upload manuel du JSON vers o2switch

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   📤 UPLOAD MANUEL DU JSON VERS O2SWITCH" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Vérifier que WinSCP est installé
$winscpPath = "C:\Program Files (x86)\WinSCP\WinSCP.com"

if (-not (Test-Path $winscpPath)) {
    Write-Host "❌ WinSCP n'est pas installé." -ForegroundColor Red
    Write-Host ""
    Write-Host "Solutions alternatives :" -ForegroundColor Yellow
    Write-Host "1. Installe WinSCP : https://winscp.net/download/WinSCP-6.3.5-Setup.exe" -ForegroundColor Yellow
    Write-Host "2. Ou lance le workflow GitHub Actions manuellement" -ForegroundColor Yellow
    Write-Host "3. Ou attends ce soir 22h30 (automatique)" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit
}

# Demander les identifiants FTP (ou utiliser les secrets)
Write-Host "🔑 Identifiants FTP o2switch" -ForegroundColor Yellow
Write-Host ""
$ftpServer = Read-Host "Serveur FTP (ex: ftp.cluster011.hosting.ovh.net)"
$ftpUser = Read-Host "Utilisateur FTP"
$ftpPassword = Read-Host "Mot de passe FTP" -AsSecureString
$ftpPasswordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($ftpPassword))

# Créer le script WinSCP
$winscpScript = @"
open ftps://${ftpUser}:${ftpPasswordPlain}@${ftpServer}/ -passive=on
cd /resultat-fdj.soqe8286.odns.fr/
put resultats-cache.json
exit
"@

# Sauvegarder temporairement le script
$scriptPath = "$env:TEMP\winscp-upload.txt"
$winscpScript | Out-File -FilePath $scriptPath -Encoding ASCII

Write-Host ""
Write-Host "📤 Upload en cours..." -ForegroundColor Cyan

# Exécuter WinSCP
& $winscpPath /script=$scriptPath

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Upload réussi !" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Vérifie : http://resultat-fdj.soqe8286.odns.fr/resultats-cache.json" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors de l'upload" -ForegroundColor Red
}

# Nettoyer
Remove-Item $scriptPath -ErrorAction SilentlyContinue

Write-Host ""
pause

