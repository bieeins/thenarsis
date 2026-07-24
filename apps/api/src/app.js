import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import crypto from 'node:crypto';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { apiRateLimiter } from './middleware/rate-limit.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import routes from './routes/index.js';

export const app = express();

// Hostinger menjalankan Node.js di belakang reverse proxy.
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: env.frontendUrl,
  credentials: true,
}));
app.use(pinoHttp({
  logger,
  genReqId: (req) => req.headers['x-request-id'] || crypto.randomUUID(),
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use('/api', apiRateLimiter);

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);
