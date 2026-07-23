import 'dotenv/config';

const base = {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.NODE_ENV === 'test' ? (process.env.DB_NAME_TEST || `${process.env.DB_NAME || 'thenarsis'}_test`) : (process.env.DB_NAME || 'thenarsis'),
    charset: 'utf8mb4',
    typeCast: function (field, next) {
      if (field.type === 'TINY' && field.length === 1) {
        return field.string() === '1';
      }
      return next();
    },
  },
  pool: {
    min: 2,
    max: Number(process.env.DB_CONNECTION_LIMIT || 10),
  },
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './seeds',
  },
};

export default {
  development: base,
  test: base,
  production: base,
};
