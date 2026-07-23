import knexFactory from 'knex';
import knexfile from '../../knexfile.js';
import { env } from './env.js';

const config = knexfile[env.nodeEnv] || knexfile.development;

export const db = knexFactory(config);

export async function checkDatabaseConnection() {
  await db.raw('select 1');
}
