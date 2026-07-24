import 'dotenv/config';

const REQUIRED_IN_PRODUCTION = [
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'FRONTEND_URL',
];

const isProduction = process.env.NODE_ENV === 'production';

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if ((value === undefined || value === '') && (isProduction || REQUIRED_IN_PRODUCTION.includes(name) === false)) {
    return value;
  }
  return value;
}

if (isProduction) {
  const missing = REQUIRED_IN_PRODUCTION.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

if (!isProduction && (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET)) {
  // eslint-disable-next-line no-console
  console.warn('JWT_ACCESS_SECRET/JWT_REFRESH_SECRET not set — using insecure development defaults. Set them before deploying.');
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  port: Number(process.env.PORT || 3000),
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    name: process.env.DB_NAME || 'thenarsis',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-insecure-access-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-insecure-refresh-secret-change-me',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  cookie: {
    secure: process.env.COOKIE_SECURE === 'true',
    domain: process.env.COOKIE_DOMAIN || undefined,
    sameSite: process.env.COOKIE_SAME_SITE || 'strict',
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'no-reply@thenarsis.online',
  },

  storage: {
    driver: process.env.STORAGE_DRIVER || 'local',
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    maxUploadSize: Number(process.env.MAX_UPLOAD_SIZE || 10485760),
    allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,application/pdf')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },

  logLevel: process.env.LOG_LEVEL || 'info',

  rateLimit: {
    windowMs: Number(process.env.API_RATE_LIMIT_WINDOW_MS || 5 * 60 * 1000),
    limit: Number(process.env.API_RATE_LIMIT_MAX || 1000),
    loginLimit: Number(process.env.LOGIN_RATE_LIMIT_MAX || 20),
  },

  pbExportDir: process.env.PB_EXPORT_DIR || '',
};
