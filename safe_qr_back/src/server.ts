import 'dotenv/config';

import { loadEnv } from './config/env.js';
import { createLogger } from './lib/logger.js';
import { buildApp } from './app.js';

async function main(): Promise<void> {
  const env = loadEnv();
  const logger = createLogger(env);
  const app = await buildApp(env, logger);

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Encerrando servidor');
    try {
      await app.close();
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Erro ao encerrar');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    logger.info({ port: env.PORT }, 'Safe QR API escutando');
  } catch (err) {
    logger.fatal({ err }, 'Falha ao subir o servidor');
    process.exit(1);
  }
}

void main();
