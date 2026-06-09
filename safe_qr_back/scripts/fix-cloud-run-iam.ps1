# Corrige IAM para deploy Cloud Run com --source (projetos novos GCP/Firebase)
# Uso: .\scripts\fix-cloud-run-iam.ps1

param(
    [string]$Project = "safe-qr-app",
    [string]$ProjectNumber = "214537528312"
)

$ErrorActionPreference = "Stop"

$ComputeSa = "${ProjectNumber}-compute@developer.gserviceaccount.com"
$CloudBuildSa = "${ProjectNumber}@cloudbuild.gserviceaccount.com"
$RunRobot = "service-${ProjectNumber}@serverless-robot-prod.iam.gserviceaccount.com"

Write-Host ">> Projeto: $Project ($ProjectNumber)" -ForegroundColor Cyan
gcloud config set project $Project

function Grant-Role($Member, $Role) {
    Write-Host "   + $Role -> $Member" -ForegroundColor DarkGray
    gcloud projects add-iam-policy-binding $Project `
        --member="serviceAccount:$Member" `
        --role="$Role" `
        --quiet | Out-Null
}

Write-Host ">> Conta de build (Compute default)..." -ForegroundColor Cyan
Grant-Role $ComputeSa "roles/run.builder"
Grant-Role $ComputeSa "roles/storage.admin"
Grant-Role $ComputeSa "roles/artifactregistry.writer"
Grant-Role $ComputeSa "roles/logging.logWriter"

Write-Host ">> Conta Cloud Build (legada)..." -ForegroundColor Cyan
Grant-Role $CloudBuildSa "roles/run.admin"
Grant-Role $CloudBuildSa "roles/storage.admin"
Grant-Role $CloudBuildSa "roles/artifactregistry.writer"
Grant-Role $CloudBuildSa "roles/iam.serviceAccountUser"

Write-Host ">> Cloud Run Service Agent..." -ForegroundColor Cyan
Grant-Role $RunRobot "roles/artifactregistry.reader"

Write-Host ""
Write-Host "OK. Aguarde ~1 min e rode: .\scripts\deploy-cloud-run.ps1" -ForegroundColor Green
