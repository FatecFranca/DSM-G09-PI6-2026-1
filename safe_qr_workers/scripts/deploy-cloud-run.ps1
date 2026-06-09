# Deploy consumidores Pub/Sub no Cloud Run (history + audit)
# Uso: .\scripts\deploy-cloud-run.ps1

param(
    [string]$Project = "safe-qr-app",
    [string]$Region = "southamerica-east1"
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$CommonEnv = "NODE_ENV=production,LOG_LEVEL=info,GCP_PROJECT_ID=$Project,CONSUMER_ENABLED=true,FIRESTORE_ENABLED=true,PUBSUB_SUBSCRIPTION_AUDIT=safe-qr-analyze-events-sub,PUBSUB_SUBSCRIPTION_HISTORY=safe-qr-analyze-events-sub-history,FIRESTORE_COLLECTION=scan_events"

Write-Host ">> Projeto: $Project | Regiao: $Region" -ForegroundColor Cyan
gcloud config set project $Project

$billing = gcloud billing projects describe $Project --format "value(billingEnabled)" 2>$null
if ($LASTEXITCODE -ne 0 -or $billing -ne "True") {
    Write-Host "ERRO: billing inativo no projeto $Project" -ForegroundColor Red
    exit 1
}

Write-Host ">> Habilitando APIs..." -ForegroundColor Cyan
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com pubsub.googleapis.com --quiet

Write-Host ">> Garantindo subscription de historico..." -ForegroundColor Cyan
gcloud pubsub subscriptions describe safe-qr-analyze-events-sub-history --project=$Project 2>$null
if ($LASTEXITCODE -ne 0) {
    gcloud pubsub subscriptions create safe-qr-analyze-events-sub-history `
        --topic=safe-qr-analyze-events `
        --ack-deadline=60 `
        --project=$Project
}

function Deploy-Worker($Service, $Role) {
    Write-Host ""
    Write-Host ">> Deploy $Service (CONSUMER_ROLE=$Role)..." -ForegroundColor Cyan
    gcloud run deploy $Service `
        --source . `
        --region $Region `
        --platform managed `
        --no-allow-unauthenticated `
        --ingress internal `
        --min-instances 1 `
        --max-instances 1 `
        --memory 512Mi `
        --cpu 1 `
        --no-cpu-throttling `
        --port 8080 `
        --set-env-vars "$CommonEnv,CONSUMER_ROLE=$Role"
}

Deploy-Worker "safe-qr-worker-history" "history"
Deploy-Worker "safe-qr-worker-audit" "audit"

Write-Host ""
Write-Host ">> Reforçando min-instances=1 (evita worker parado)..." -ForegroundColor Cyan
gcloud run services update safe-qr-worker-history --region $Region --min-instances=1 --max-instances=1 --no-cpu-throttling --quiet
gcloud run services update safe-qr-worker-audit --region $Region --min-instances=1 --max-instances=1 --no-cpu-throttling --quiet

Write-Host ""
Write-Host "OK. Workers no ar (min-instances=1, CPU sempre alocado)." -ForegroundColor Green
Write-Host ""
Write-Host "IAM na SA do Cloud Run (214537528312-compute@... ou a do servico):" -ForegroundColor Yellow
Write-Host "  - roles/pubsub.subscriber"
Write-Host "  - roles/datastore.user"
Write-Host ""
Write-Host "Teste: escanear QR no app (remote) -> Firestore history/{uid}/items"
