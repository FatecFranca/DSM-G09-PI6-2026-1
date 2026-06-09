# Deploy Safe QR API no Google Cloud Run
# Pré-requisitos: gcloud CLI autenticado, projeto safe-qr-app, APIs Run + Cloud Build habilitadas
#
# Uso (na pasta safe_qr_back):
#   .\scripts\deploy-cloud-run.ps1
#   .\scripts\deploy-cloud-run.ps1 -Region southamerica-east1

param(
    [string]$Project = "safe-qr-app",
    [string]$Service = "safe-qr-api",
    [string]$Region = "southamerica-east1"
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host ">> Projeto: $Project | Serviço: $Service | Região: $Region" -ForegroundColor Cyan

gcloud config set project $Project

Write-Host ">> Verificando billing..." -ForegroundColor Cyan
$billing = gcloud billing projects describe $Project --format "value(billingEnabled)" 2>$null
if ($LASTEXITCODE -ne 0 -or $billing -ne "True") {
    Write-Host ""
    Write-Host "ERRO: O projeto '$Project' nao tem faturamento (billing) ativo." -ForegroundColor Red
    Write-Host "Cloud Run exige plano Blaze no Firebase ou conta de faturamento no GCP." -ForegroundColor Red
    Write-Host ""
    Write-Host "Como resolver:" -ForegroundColor Yellow
    Write-Host "  1. Firebase Console -> safe-qr-app -> Upgrade (plano Blaze)"
    Write-Host "     https://console.firebase.google.com/project/safe-qr-app/usage/details"
    Write-Host "  2. Ou GCP Console -> Billing -> vincular conta ao projeto"
    Write-Host "     https://console.cloud.google.com/billing/linkedaccount?project=$Project"
    Write-Host ""
    Write-Host "Detalhes: docs/deploy-cloud-run.md#billing-obrigatorio"
    exit 1
}

Write-Host ">> Habilitando APIs (idempotente)..." -ForegroundColor Cyan
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com --quiet

Write-Host ">> Deploy (build na nuvem via Dockerfile)..." -ForegroundColor Cyan
gcloud run deploy $Service `
    --source . `
    --region $Region `
    --platform managed `
    --allow-unauthenticated `
    --memory 512Mi `
    --cpu 1 `
    --min-instances 0 `
    --max-instances 10 `
    --port 8080 `
    --set-env-vars "NODE_ENV=production,LOG_LEVEL=info,GCP_PROJECT_ID=$Project,PUBSUB_ENABLED=true,PUBSUB_TOPIC=safe-qr-analyze-events,MAX_RAW_CONTENT_BYTES=8192"

Write-Host ""
Write-Host ">> URL do serviço:" -ForegroundColor Green
gcloud run services describe $Service --region $Region --format "value(status.url)"

Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "  1. Conceder IAM à conta de serviço do Cloud Run (ver docs/deploy-cloud-run.md)"
Write-Host "  2. Atualizar API_BASE_URL no safe_qr_app/assets/.env"
Write-Host "  3. Subir safe_qr_workers: cd ..\safe_qr_workers; .\scripts\deploy-cloud-run.ps1"
