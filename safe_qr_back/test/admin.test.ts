import { describe, expect, it } from 'vitest';

import { loadEnv } from '../src/config/env.js';
import { buildApp } from '../src/app.js';
import { createLogger } from '../src/lib/logger.js';

const ADMIN_KEY = 'test-admin-key-12345';

function adminHeader(key = ADMIN_KEY) {
  return { 'x-admin-key': key };
}

async function createAdminTestApp() {
  const env = loadEnv({
    ...process.env,
    NODE_ENV: 'test',
    LOG_LEVEL: 'fatal',
    GOOGLE_APPLICATION_CREDENTIALS: '',
    FIREBASE_SERVICE_ACCOUNT_JSON: '',
    PUBSUB_ENABLED: 'false',
    GCP_PROJECT_ID: '',
    ADMIN_API_KEY: ADMIN_KEY,
  });
  const logger = createLogger(env);
  return buildApp(env, logger);
}

describe('GET /v1/admin/stats', () => {
  it('retorna estatísticas com admin key válida', async () => {
    const app = await createAdminTestApp();
    const res = await app.inject({
      method: 'GET',
      url: '/v1/admin/stats',
      headers: adminHeader(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      api: { status: string };
      scanEvents: { total: number; byVerdict: Record<string, number> };
      blocklist: { total: number };
    };
    expect(body.api.status).toBe('ok');
    expect(body.scanEvents.total).toBeGreaterThan(0);
    expect(body.blocklist.total).toBeGreaterThan(0);
    await app.close();
  });

  it('rejeita sem admin key → 401', async () => {
    const app = await createAdminTestApp();
    const res = await app.inject({ method: 'GET', url: '/v1/admin/stats' });
    expect(res.statusCode).toBe(401);
    await app.close();
  });
});

describe('GET /v1/scan-events', () => {
  it('lista eventos seed em memória', async () => {
    const app = await createAdminTestApp();
    const res = await app.inject({
      method: 'GET',
      url: '/v1/scan-events?limit=10',
      headers: adminHeader(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { items: unknown[]; total: number };
    expect(body.total).toBe(3);
    expect(body.items).toHaveLength(3);
    await app.close();
  });

  it('filtra por verdict', async () => {
    const app = await createAdminTestApp();
    const res = await app.inject({
      method: 'GET',
      url: '/v1/scan-events?verdict=unsafe',
      headers: adminHeader(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { items: { verdict: string }[]; total: number };
    expect(body.total).toBe(1);
    expect(body.items[0]?.verdict).toBe('unsafe');
    await app.close();
  });
});

describe('CRUD /v1/admin/blocklist', () => {
  it('lista, adiciona e remove entrada', async () => {
    const app = await createAdminTestApp();

    const listRes = await app.inject({
      method: 'GET',
      url: '/v1/admin/blocklist',
      headers: adminHeader(),
    });
    expect(listRes.statusCode).toBe(200);
    const initial = listRes.json() as { total: number };
    expect(initial.total).toBe(2);

    const addRes = await app.inject({
      method: 'POST',
      url: '/v1/admin/blocklist',
      headers: adminHeader(),
      payload: { entry: 'evil-new-site.com' },
    });
    expect(addRes.statusCode).toBe(201);
    expect(addRes.json()).toMatchObject({ entry: 'evil-new-site.com', action: 'added' });

    const dupRes = await app.inject({
      method: 'POST',
      url: '/v1/admin/blocklist',
      headers: adminHeader(),
      payload: { entry: 'evil-new-site.com' },
    });
    expect(dupRes.statusCode).toBe(200);
    expect(dupRes.json()).toMatchObject({ action: 'unchanged' });

    const delRes = await app.inject({
      method: 'DELETE',
      url: '/v1/admin/blocklist',
      headers: adminHeader(),
      payload: { entry: 'evil-new-site.com' },
    });
    expect(delRes.statusCode).toBe(200);
    expect(delRes.json()).toMatchObject({ action: 'removed' });

    const missingRes = await app.inject({
      method: 'DELETE',
      url: '/v1/admin/blocklist',
      headers: adminHeader(),
      payload: { entry: 'nao-existe.com' },
    });
    expect(missingRes.statusCode).toBe(404);

    await app.close();
  });
});
