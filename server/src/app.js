import express from 'express';
import cors from 'cors';
import { testConnection } from './config/db.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import { apiRouter } from './routes/index.js';

// checkDb can be swapped in tests so they do not need MySQL.
export function createApp({ clientUrl, checkDb = testConnection, rateLimits = true } = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.use(securityHeaders);
  app.use(cors({ origin: clientUrl }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/health/db', async (req, res) => {
    const result = await checkDb();
    if (result.ok) return res.json({ status: 'ok', message: result.message });
    return res.status(503).json({ message: result.message, code: 'DB_DOWN' });
  });

  app.use('/api', apiRouter({ limits: rateLimits }));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
