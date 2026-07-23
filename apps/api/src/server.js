import { app } from './app.js';
import { env } from './config/env.js';
import { checkDatabaseConnection } from './config/database.js';
import { logger } from './utils/logger.js';

async function main() {
  try {
    await checkDatabaseConnection();
  } catch (err) {
    logger.error({ err }, 'database_connection_failed');
    process.exit(1);
  }

  app.listen(env.port, '0.0.0.0', () => {
    logger.info(`Thenarsis API listening on 0.0.0.0:${env.port} (${env.nodeEnv})`);
  });
}

main();
