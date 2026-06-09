# Deploy safe_qr_web → Firebase Hosting (projeto safe-qr-app)
# Uso: .\scripts\deploy-firebase-hosting.ps1

$ErrorActionPreference = "Stop"
$ProjectId = "safe-qr-app"
$Root = Split-Path -Parent $PSScriptRoot

Push-Location $Root
try {
    Write-Host "==> Build de producao (Vite + .env.production)" -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build falhou" }

    Write-Host "==> Deploy Firebase Hosting ($ProjectId)" -ForegroundColor Cyan
    npx firebase deploy --only hosting --project $ProjectId
    if ($LASTEXITCODE -ne 0) { throw "firebase deploy falhou" }

    Write-Host ""
    Write-Host "Painel publicado. URLs tipicas:" -ForegroundColor Green
    Write-Host "  https://$ProjectId.web.app"
    Write-Host "  https://$ProjectId.firebaseapp.com"
    Write-Host ""
    Write-Host "Lembrete: configure ADMIN_API_KEY no Cloud Run (safe-qr-api) e use a mesma chave no login do painel." -ForegroundColor Yellow
}
finally {
    Pop-Location
}
