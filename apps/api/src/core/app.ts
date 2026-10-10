// Express application setup
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { config } from './config.js';
import { logger } from './logger.js';
import { ApiError } from './errors.js';
import { generalRateLimiter } from './middleware.js';
import type { ErrorCode } from '@meetmaze/shared/core';

export function createApp(): express.Express {
  const app = express();

  // Security
  app.use(helmet());
  app.use(
    cors({
      origin: config.WEB_URL,
      credentials: true,
    }),
  );

  // Parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // Logging
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => req.url === '/api/v1/health',
      },
    }),
  );

  // General rate limit
  app.use(generalRateLimiter);

  // Health check is mounted in loader after modules

  // 404 handler for unmatched routes
  app.use('/api/v1/*', (_req, res) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND' as ErrorCode, message: 'Endpoint not found' },
    });
  });

  // Global error handler
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      if (err instanceof ApiError) {
        res.status(err.status).json({
          success: false,
          error: {
            code: err.code,
            message: err.message,
            details: err.details,
          },
        });
        return;
      }

      logger.error(err, 'Unhandled error');
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL' as ErrorCode,
          message: 'An unexpected error occurred',
        },
      });
    },
  );

  return app;
}
