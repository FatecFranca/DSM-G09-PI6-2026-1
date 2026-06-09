import http from 'node:http';

import {
  loadEnv,
  resolveAuditSubscription,
  resolveHistorySubscription,
} from '../src/config/env.js';
import { QrAnalyzedAuditHandler } from '../src/handlers/qr-analyzed-audit.handler.js';
import { QrAnalyzedHistoryHandler } from '../src/handlers/qr-analyzed-history.handler.js';
import { createHistoryRepository } from '../src/repositories/create-history-repository.js';
import { createScanEventRepository } from '../src/repositories/create-scan-event-repository.js';
import { runConsumer } from './run-consumer.js';

type ConsumerRole = 'history' | 'audit';

function resolveRole(): ConsumerRole {
  const role = process.env.CONSUMER_ROLE?.trim();
  if (role === 'history' || role === 'audit') {
    return role;
  }
  throw new Error('CONSUMER_ROLE obrigatório: "history" ou "audit"');
}

function startHealthServer(role: ConsumerRole, port: number): void {
  const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/v1/health' || req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', service: `safe-qr-worker-${role}`, role }));
      return;
    }
    res.writeHead(404).end();
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`Health server :${port} (consumer=${role})`);
  });
}

async function main(): Promise<void> {
  const role = resolveRole();
  const env = loadEnv();
  const port = Number(process.env.PORT) || 8080;

  startHealthServer(role, port);

  if (role === 'history') {
    await runConsumer({
      role: 'history',
      subscription: resolveHistorySubscription(env),
      createHandler: (handlerEnv, logger) => {
        const history = createHistoryRepository(handlerEnv, logger);
        return new QrAnalyzedHistoryHandler(logger, history);
      },
    });
    return;
  }

  await runConsumer({
    role: 'audit',
    subscription: resolveAuditSubscription(env),
    createHandler: (handlerEnv, logger) => {
      const scanEvents = createScanEventRepository(handlerEnv, logger);
      return new QrAnalyzedAuditHandler(logger, scanEvents, handlerEnv.FIRESTORE_COLLECTION);
    },
  });
}

void main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
