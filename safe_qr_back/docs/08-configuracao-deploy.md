# 08 — Configuração e deploy

## Pré-requisitos

- **Node.js 20+** ([nodejs.org](https://nodejs.org))
- **npm** (incluído com Node)
- (Opcional) Conta de serviço Firebase para lista de clones

## Setup local

```bash
cd safe_qr_back
cp .env.example .env
npm install
npm run dev
```

Servidor disponível em `http://0.0.0.0:3000` (acessível na LAN).

### Verificar instalação

```bash
curl http://localhost:3000/v1/health
npm test
```

## Variáveis de ambiente

Todas validadas em `src/config/env.ts` com Zod na inicialização. Valores inválidos **impedem** o boot.

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `NODE_ENV` | `development` \| `test` \| `production` | `development` | Ambiente de execução |
| `PORT` | number | `3000` | Porta HTTP |
| `LOG_LEVEL` | pino level | `info` | `fatal`…`trace` |
| `MAX_RAW_CONTENT_BYTES` | number | `8192` | Limite UTF-8 do `rawContent` (max 1MB) |
| `GOOGLE_APPLICATION_CREDENTIALS` | string? | — | Caminho para JSON da conta de serviço |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | string? | — | JSON inline da conta de serviço |
| `FIRESTORE_SUSPICIOUS_CACHE_MS` | number | `60000` | TTL cache blocklist (max 3600000) |

### Exemplo `.env` completo

```env
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
MAX_RAW_CONTENT_BYTES=8192

# Firestore (opcional — descomente uma opção)
GOOGLE_APPLICATION_CREDENTIALS=./safe-qr-app-dbc39536954e.json
# FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
# FIRESTORE_SUSPICIOUS_CACHE_MS=60000
```

## Build para produção

```bash
npm run build    # gera dist/
npm start        # node dist/server.js
```

O build usa `tsconfig.build.json` (emite ESM para `dist/`).

## Conectar o app Flutter

### Produção (Cloud Run)

```env
API_BASE_URL=https://safe-qr-api-iw32tfemba-rj.a.run.app
ANALYZE_MODE=remote
```

Arquivo: `safe_qr_app/assets/.env`. Reinicie o app após alterar (hot reload não recarrega `.env`).

### Desenvolvimento local

```env
API_BASE_URL=http://192.168.x.x:3000
ANALYZE_MODE=remote
```

> **Android emulador:** `http://10.0.2.2:3000`  
> **Dispositivo físico:** IP da máquina na mesma Wi‑Fi (`npm run dev` mostra o IP).

O app faz health check no bootstrap (`GET /v1/health`).

## Deploy em nuvem (opções)

### Google Cloud Run (recomendado para o ecossistema Firebase)

**Guia completo:** [deploy-cloud-run.md](./deploy-cloud-run.md)

```powershell
cd safe_qr_back
.\scripts\deploy-cloud-run.ps1
```

Artefatos no repositório: `Dockerfile`, `.dockerignore`, `scripts/deploy-cloud-run.ps1`.

- Build multi-stage (TypeScript → `dist/`)
- **ADC** automático — sem JSON de conta de serviço no container
- `SIGTERM` → graceful shutdown (Cloud Run)

### Render / Railway / Fly.io

- Definir `PORT` (alguns PaaS injetam automaticamente)
- `npm run build && npm start` como comando de start
- `FIREBASE_SERVICE_ACCOUNT_JSON` como secret de ambiente

### VM / VPS

- `pm2` ou systemd para manter o processo
- Nginx/Caddy como reverse proxy com TLS
- Firewall: expor apenas 443

## Checklist de produção

| Item | Status atual | Ação |
|------|--------------|------|
| TLS/HTTPS | ✅ Cloud Run | HTTPS automático na URL `.run.app` |
| CORS restrito | `origin: true` | Restringir domínios do app |
| Rate limiting | Não implementado | Adicionar `@fastify/rate-limit` |
| Autenticação API | Não | Avaliar API key se exposto publicamente |
| Secrets no Git | ✅ `.gitignore` | Nunca commitar `.env` ou JSON |
| Health check | ✅ | Usar em load balancer |
| Logs centralizados | Pino JSON | Enviar para Cloud Logging / Datadog |

## Docker Compose (exemplo local)

```yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    environment:
      - NODE_ENV=production
```

## Troubleshooting

| Problema | Causa provável | Solução |
|----------|----------------|---------|
| `Invalid environment` no boot | Env mal formatado | Verificar tipos (PORT numérico) |
| Firestore não lista hosts | Credenciais ausentes | Configurar `GOOGLE_APPLICATION_CREDENTIALS` |
| App não alcança API | Rede/firewall | IP correto, mesma Wi‑Fi, porta aberta |
| `413` inesperado | QR muito grande | Aumentar `MAX_RAW_CONTENT_BYTES` |
| Logs verbosos | `LOG_LEVEL=debug` | Usar `info` em produção |

## Arquivos sensíveis (`.gitignore`)

```
.env
.env.*
! .env.example
safe-qr-app-*.json
*-firebase-adminsdk-*.json
service-account*.json
```
