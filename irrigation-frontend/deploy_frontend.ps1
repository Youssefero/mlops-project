# deploy_frontend.ps1
# Lance depuis : C:\Users\ZIDAN\Desktop\MLops_project\irrigation-frontend\
# Commande    : powershell -ExecutionPolicy Bypass -File deploy_frontend.ps1

Write-Host ""
Write-Host "SmartIrrig Frontend — Deploiement automatique" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""

$src = "src"
$comp = "src\components"

# Créer le dossier components si absent
if (-not (Test-Path $comp)) {
    New-Item -ItemType Directory -Path $comp | Out-Null
    Write-Host "Dossier components/ cree" -ForegroundColor Cyan
}

# Télécharger les fichiers depuis les outputs
$files = @(
    @{ url = ""; dest = "$src\App.css";                      name = "App.css" },
    @{ url = ""; dest = "$src\App.js";                       name = "App.js" },
    @{ url = ""; dest = "$comp\Navbar.js";                   name = "Navbar.js" },
    @{ url = ""; dest = "$comp\PredictionPage.js";           name = "PredictionPage.js" },
    @{ url = ""; dest = "$comp\DataDashboard.js";            name = "DataDashboard.js" },
)

Write-Host "Fichiers a creer manuellement dans VSCode :" -ForegroundColor Yellow
Write-Host ""
Write-Host "  src/App.css                      <- Remplace le contenu existant" -ForegroundColor White
Write-Host "  src/App.js                       <- Remplace le contenu existant" -ForegroundColor White
Write-Host "  src/components/Navbar.js         <- Nouveau fichier" -ForegroundColor White
Write-Host "  src/components/PredictionPage.js <- Nouveau fichier" -ForegroundColor White
Write-Host "  src/components/DataDashboard.js  <- Nouveau fichier" -ForegroundColor White
Write-Host ""
Write-Host "Fichiers a SUPPRIMER de src/components/ :" -ForegroundColor Red
Write-Host "  Header.js, HealthStatus.js, PredictionForm.js" -ForegroundColor Red
Write-Host "  PredictionResult.js, PredictionHistory.js" -ForegroundColor Red
Write-Host ""
Write-Host "Apres avoir cree les fichiers, lance : npm start" -ForegroundColor Green
Write-Host ""

# Supprimer les anciens composants
$old = @("$comp\Header.js","$comp\HealthStatus.js","$comp\PredictionForm.js",
         "$comp\PredictionResult.js","$comp\PredictionHistory.js")

$deleted = 0
foreach ($f in $old) {
    if (Test-Path $f) {
        Remove-Item $f
        Write-Host "  Supprime : $f" -ForegroundColor DarkGray
        $deleted++
    }
}

if ($deleted -gt 0) {
    Write-Host ""
    Write-Host "$deleted ancien(s) fichier(s) supprime(s) automatiquement." -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Verification des dependances..." -ForegroundColor Yellow
npm list recharts axios 2>$null | Select-String "recharts|axios" | ForEach-Object {
    Write-Host "  OK: $_" -ForegroundColor Green
}

Write-Host ""
Write-Host "Tout est pret ! Copie les fichiers telecharges puis lance : npm start" -ForegroundColor Green
