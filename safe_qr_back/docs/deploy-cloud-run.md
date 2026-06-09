# Deploy no Google Cloud Run

Guia passo a passo para publicar o `safe-qr-api` no mesmo projeto Firebase **`safe-qr-app`**.

## Produção (junho 2026 — stack completa validada)

| Serviço Cloud Run | URL / papel |
|-------------------|-------------|
| **`safe-qr-api`** | https://safe-qr-api-iw32tfemba-rj.a.run.app — API pública |
| **`safe-qr-worker-history`** | interno — consumidor histórico |
| **`safe-qr-worker-audit`** | interno — consumidor auditoria |

| Item | Valor |
|------|-------|
| **Projeto GCP / Firebase** | `safe-qr-app` (`214537528312`) |
| **Região** | `southamerica-east1` (São Paulo) |
| **Health API** | `GET /v1/health` → `200` + `{ "status": "ok", ... }` |

```powershell
curl https://safe-qr-api-iw32tfemba-rj.a.run.app/v1/health
```

### App Flutter (configurado)

`safe_qr_app/assets/.env`:

```env
API_BASE_URL=https://safe-qr-api-iw32tfemba-rj.a.run.app
ANALYZE_MODE=remote
```

> Reinicie o app após alterar o `.env` (hot reload não recarrega assets).

---

## Pré-requisitos

1. [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (`gcloud`) instalado
2. Login: `gcloud auth login`
3. Projeto: `gcloud config set project safe-qr-app`
4. **Plano Blaze** no Firebase (billing ativo)

## Billing obrigatório

O erro `UREQ_PROJECT_BILLING_NOT_FOUND` significa plano **Spark**. Cloud Run, Cloud Build e Pub/Sub exigem **Blaze**.

1. [Firebase → safe-qr-app → Usage and billing](https://console.firebase.google.com/project/safe-qr-app/usage/details)
2. **Upgrade** → **Blaze (pay as you go)**

Verificar:

```powershell
gcloud billing projects describe safe-qr-app
# billingEnabled: true
```

---

## Deploy (script)

```powershell
cd safe_qr_back
npm run build    # validar TypeScript antes (obrigatório — Cloud Build roda o mesmo)
.\scripts\deploy-cloud-run.ps1
```

Artefatos: `Dockerfile`, `.dockerignore`, `scripts/deploy-cloud-run.ps1`, `scripts/fix-cloud-run-iam.ps1`.

### Variáveis no Cloud Run

| Variável | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `LOG_LEVEL` | `info` |
| `GCP_PROJECT_ID` | `safe-qr-app` |
| `PUBSUB_ENABLED` | `true` |
| `PUBSUB_TOPIC` | `safe-qr-analyze-events` |
| `PORT` | *(injetado pelo Cloud Run — não definir)* |

Sem `GOOGLE_APPLICATION_CREDENTIALS`: a API usa **ADC** da service account do serviço (`K_SERVICE` detectado em `hasFirebaseCredentials`).

---

## IAM — Console GCP

Abra: https://console.cloud.google.com/iam-admin/iam?project=safe-qr-app

Conta principal: **`214537528312-compute@developer.gserviceaccount.com`** (*Default compute service account*).

### Parte 1 — Build e deploy (obrigatório antes do 1º deploy)

| Papel | ID |
|-------|-----|
| Cloud Run Builder | `roles/run.builder` |
| Storage Admin | `roles/storage.admin` |
| Artifact Registry Writer | `roles/artifactregistry.writer` |
| Logs Writer | `roles/logging.logWriter` |

Erro típico sem isso: `PERMISSION_DENIED` no bucket `run-sources-safe-qr-app-...`.

### Parte 2 — API em runtime (obrigatório para analyze/history)

| Papel | ID | Uso |
|-------|-----|-----|
| Cloud Datastore User | `roles/datastore.user` | Firestore |
| Firebase Authentication Admin | `roles/firebaseauth.admin` | `verifyIdToken` |
| Pub/Sub Publisher | `roles/pubsub.publisher` | Evento `qr.analyzed` |

Erro típico sem isso: `503` (`auth_not_configured`) ou histórico/Pub/Sub falhando.

### (Opcional) Conta Cloud Build legada

`214537528312@cloudbuild.gserviceaccount.com` — se o build ainda falhar:

- Cloud Run Admin, Storage Admin, Artifact Registry Writer, Service Account User

Ou rode: `.\scripts\fix-cloud-run-iam.ps1`

---

## Verificar deploy

```powershell
# Health
curl https://safe-qr-api-iw32tfemba-rj.a.run.app/v1/health

# Analyze (substituir <JWT> por getIdToken() do app)
curl -X POST https://safe-qr-api-iw32tfemba-rj.a.run.app/v1/qr/analyze `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <JWT>" `
  -d '{"rawContent":"https://example.com","client":{"platform":"android"}}'
```

---

## Histórico assíncrono (`safe_qr_workers`)

O analyze publica `qr.analyzed` no Pub/Sub. Dois consumidores gravam no Firestore:

| Serviço Cloud Run | Função |
|-------------------|--------|
| `safe-qr-worker-history` | `history/{uid}/items` — **obrigatório** para aba Histórico |
| `safe-qr-worker-audit` | `scan_events` — auditoria (opcional acadêmico) |

Deploy:

```powershell
cd safe_qr_workers
.\scripts\deploy-cloud-run.ps1
```

Guia completo: [`../../safe_qr_workers/docs/deploy-cloud-run.md`](../../safe_qr_workers/docs/deploy-cloud-run.md)

---

## Build local da imagem (opcional)

```bash
docker build -t safe-qr-api:local .
docker run --rm -p 8080:8080 -e PORT=8080 -e NODE_ENV=production safe-qr-api:local
```

---

## Troubleshooting (erros reais do projeto)

| Erro | Causa | Solução |
|------|-------|---------|
| `UREQ_PROJECT_BILLING_NOT_FOUND` | Plano Spark | Upgrade Blaze |
| `PERMISSION_DENIED` … `run-sources-...` | IAM build | Parte 1 (papéis na compute SA) |
| `Build failed` (sem detalhe IAM) | `npm run build` falha no Docker | Corrigir erros TypeScript; rodar `npm run build` local antes |
| `503` em analyze/history | IAM runtime | Parte 2 (Datastore, Firebase Auth, Pub/Sub) |
| `401` no app | JWT expirado | `getIdToken(true)` no Flutter |
| Histórico vazio após scan | Worker `min: 0` ou parado | `safe-qr-worker-history` com `min-instances=1`; ver [workers deploy](../../safe_qr_workers/docs/deploy-cloud-run.md#troubleshooting) |
| Histórico vazio | Consumidor local + nuvem | Parar `consume:history` local |
| Cold start lento (API) | `min-instances=0` no back | Opcional `--min-instances 1` no `safe-qr-api` |

### Build TypeScript

O Cloud Build executa `npm run build` dentro do `Dockerfile`. Vitest (`npm test`) **não** substitui essa etapa — sempre validar:

```powershell
npm run build && npm test
```

---

## Painel admin (`safe_qr_web`) — `ADMIN_API_KEY`

O painel web (Firebase Hosting) autentica com header `X-Admin-Key`. Defina a mesma chave na API:

```powershell
gcloud run services update safe-qr-api `
  --region southamerica-east1 `
  --project safe-qr-app `
  --update-env-vars "ADMIN_API_KEY=SUA_CHAVE_SEGURA_AQUI"
```

Deploy do painel: [`../../safe_qr_web/docs/deploy-firebase-hosting.md`](../../safe_qr_web/docs/deploy-firebase-hosting.md)

---

## Redeploy após mudanças no código

```powershell
cd safe_qr_back
npm run build
.\scripts\deploy-cloud-run.ps1
```

A URL permanece a mesma; o Cloud Run cria uma nova revisão (ex. `safe-qr-api-00002-...`).
