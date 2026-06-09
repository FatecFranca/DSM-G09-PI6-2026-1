# Safe QR Web

Painel administrativo web do projeto **Safe QR** — React + Vite + TypeScript.

Monitora eventos de auditoria (`scan_events`) e gerencia a blocklist de palavras-chave / domínios suspeitos.

## Stack

| Camada | Tecnologia |
|--------|------------|
| UI | React 19, Tailwind CSS 4 |
| Roteamento | React Router 7 |
| Dados | TanStack Query |
| Testes | Vitest + Testing Library |
| API | `safe_qr_back` (header `X-Admin-Key`) |

## Início rápido

**Terminal 1 — API:**

```bash
cd safe_qr_back
# Defina ADMIN_API_KEY no .env (mín. 8 caracteres)
npm run dev
```

**Terminal 2 — Painel:**

```bash
cd safe_qr_web
cp .env.example .env
npm install
npm run dev
```

Abra http://localhost:5173 e informe:

- **URL da API:** `http://localhost:3000`
- **Chave admin:** mesmo valor de `ADMIN_API_KEY` no backend

## Variáveis de ambiente

| Arquivo | Variável | Descrição |
|---------|----------|-----------|
| `safe_qr_web/.env` | `VITE_API_BASE_URL` | URL padrão da API |
| `safe_qr_web/.env` | `VITE_ADMIN_API_KEY` | Chave opcional (evita digitar no login) |
| `safe_qr_back/.env` | `ADMIN_API_KEY` | Chave obrigatória em produção |

## Telas

| Rota | Função |
|------|--------|
| `/login` | Autenticação com API key |
| `/` | Dashboard — totais e distribuição por veredito |
| `/events` | Lista de `scan_events` com filtros por veredito e paginação (10/página) |
| `/blocklist` | CRUD da blocklist Firestore com paginação (10/página) |

## Endpoints consumidos

| Método | Path | Auth |
|--------|------|------|
| `GET` | `/v1/admin/stats` | `X-Admin-Key` |
| `GET` | `/v1/scan-events?limit=&offset=&verdict=` | `X-Admin-Key` |
| `GET` | `/v1/admin/blocklist?limit=&offset=` | `X-Admin-Key` |
| `POST` | `/v1/admin/blocklist` | `X-Admin-Key` |
| `DELETE` | `/v1/admin/blocklist` | `X-Admin-Key` |

## Deploy — Firebase Hosting

Projeto Firebase: **`safe-qr-app`**

```powershell
cd safe_qr_web
npm install
.\scripts\deploy-firebase-hosting.ps1
```

URLs após deploy:

- https://safe-qr-app.web.app
- https://safe-qr-app.firebaseapp.com

Configure `ADMIN_API_KEY` no Cloud Run (`safe-qr-api`) e use a mesma chave no login do painel.

Guia completo: [docs/deploy-firebase-hosting.md](./docs/deploy-firebase-hosting.md)

## Testes

```bash
npm test
npm run lint
npm run build
```

## Monorepo

| Projeto | Papel |
|---------|-------|
| `safe_qr_app` | App mobile (Flutter) |
| `safe_qr_back` | API REST |
| `safe_qr_workers` | Consumidores Pub/Sub |
| **`safe_qr_web`** | Painel admin (este) |
