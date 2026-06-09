# Deploy — Firebase Hosting (`safe_qr_web`)

Publica o painel admin React no projeto Firebase **`safe-qr-app`** (mesmo do app mobile e da API).

## URLs após deploy

| URL | Descrição |
|-----|-----------|
| https://safe-qr-app.web.app | Hosting principal |
| https://safe-qr-app.firebaseapp.com | Alias legado |

> Se o projeto já tiver outro site no Hosting, o Firebase pode pedir `--only hosting:<site-id>`. Ver [Console → Hosting](https://console.firebase.google.com/project/safe-qr-app/hosting).

---

## Pré-requisitos

1. [Firebase CLI](https://firebase.google.com/docs/cli): `npm install -g firebase-tools` ou use `npx firebase` (já no `package.json`)
2. Login: `firebase login`
3. Projeto Blaze ativo (Hosting gratuito no plano Blaze)
4. API em produção: `safe-qr-api` no Cloud Run
5. **`ADMIN_API_KEY`** configurada no Cloud Run — ver seção abaixo

---

## Variáveis de build (produção)

Arquivo `safe_qr_web/.env.production`:

```env
VITE_API_BASE_URL=https://safe-qr-api-iw32tfemba-rj.a.run.app
```

A **chave admin não vai no build** — o operador digita no login e fica em `sessionStorage`.

---

## `ADMIN_API_KEY` na API (Cloud Run)

O painel envia `X-Admin-Key` em todas as requisições. A API precisa da mesma chave:

```powershell
gcloud run services update safe-qr-api `
  --region southamerica-east1 `
  --project safe-qr-app `
  --update-env-vars "ADMIN_API_KEY=SUA_CHAVE_SEGURA_AQUI"
```

Gere uma chave forte (mín. 8 caracteres). **Não commite** no git.

Após o update, use essa chave na tela de login do painel hospedado.

---

## Deploy (script)

```powershell
cd safe_qr_web
npm install
.\scripts\deploy-firebase-hosting.ps1
```

O script executa:

1. `npm run build` — Vite usa `.env.production`
2. `firebase deploy --only hosting --project safe-qr-app`

### Deploy manual

```powershell
cd safe_qr_web
npm run build
npx firebase deploy --only hosting --project safe-qr-app
```

---

## SPA (React Router)

`firebase.json` inclui rewrite `** → /index.html` para rotas `/events`, `/blocklist`, etc.

---

## Checklist pós-deploy

- [ ] Abrir https://safe-qr-app.web.app
- [ ] Login com `ADMIN_API_KEY` do Cloud Run
- [ ] Dashboard carrega estatísticas (`GET /v1/admin/stats`)
- [ ] Aba Eventos lista `scan_events` (após scans no app)
- [ ] Blocklist: adicionar/remover palavra-chave de teste (`amaz0n`)
- [ ] Paginação: lista com 10+ itens mostra **Anterior / Próxima** e `1–10 de N`

---

## Troubleshooting

| Sintoma | Causa | Solução |
|---------|-------|---------|
| `403` / CORS no browser | API sem header permitido | Back já permite `X-Admin-Key` no CORS |
| `401` no login | `ADMIN_API_KEY` errada ou ausente no Cloud Run | `gcloud run services update` com env var |
| `503` admin não configurado | API sem `ADMIN_API_KEY` | Definir env no Cloud Run |
| Página em branco em `/events` | Rewrite SPA ausente | Verificar `firebase.json` rewrites |
| API URL errada no painel | Build sem `.env.production` | Conferir `VITE_API_BASE_URL` antes do build |
| UI antiga após deploy | Cache do navegador no JS antigo | **Ctrl+Shift+R** ou aba anônima; conferir label **"Palavra-chave ou host"** |

---

## Documentação relacionada

- [safe_qr_back/docs/deploy-cloud-run.md](../../safe_qr_back/docs/deploy-cloud-run.md) — API Cloud Run
- [../README.md](../README.md) — painel admin
