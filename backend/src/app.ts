import path from 'node:path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env.js';
import { PASTA_UPLOADS, garantirPastasUpload } from './config/uploads.js';
import { getHealth, getReady } from './controllers/catalog.controller.js';
import { garantirCsrf, requerCsrf } from './middleware/csrf.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestContext } from './middleware/requestContext.js';
import { apiRouter } from './routes/index.js';
import { AppError } from './utils/errors.js';
import './utils/zodPt.js';

export const createApp = (): Express => {
  garantirPastasUpload();
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(requestContext);

  app.get('/health', getHealth);
  app.get('/ready', (req, res, next) => {
    void getReady(req, res).catch(next);
  });

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(
    cors({
      origin: (origin, callback) => {
        if (origin === undefined || env.corsOrigins.includes(origin.replace(/\/+$/, ''))) {
          callback(null, true);
          return;
        }
        callback(new AppError('FORBIDDEN', 'Origem não permitida.'));
      },
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '256kb' }));
  app.use(express.urlencoded({ extended: false, limit: '256kb' }));
  app.use(cookieParser());
  // Só fotos de produto são públicas. Comprovativos nunca passam por static.
  app.use(
    '/uploads/produtos',
    express.static(path.join(PASTA_UPLOADS, 'produtos'), { maxAge: '7d', index: false }),
  );

  app.use(
    '/api',
    rateLimit({
      windowMs: 60_000,
      limit: env.isTest ? 10_000 : 300,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      handler: (_req, _res, next) => {
        next(new AppError('RATE_LIMITED', 'Demasiados pedidos. Tenta novamente em instantes.'));
      },
    }),
  );

  // CSRF cookie on every API hit; mutations must also send X-CSRF-Token.
  app.use('/api', garantirCsrf, requerCsrf);
  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
