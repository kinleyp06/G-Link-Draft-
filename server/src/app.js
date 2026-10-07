import express from 'express';
import cors from 'cors';
import { testConnection } from './config/db.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// checkDb can be swapped in tests so they do not need MySQL.
export function createApp({ clientUrl, checkDb = testConnection } = {}) {
  const app = express();

  app.use(cors({ origin: clientUrl }));
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/health/db', async (req, res) => {
    const result = await checkDb();
    if (result.ok) return res.json({ status: 'ok', message: result.message });
    return res.status(503).json({ message: result.message, code: 'DB_DOWN' });
  });

  // Feature routes are mounted under /api here later, e.g. app.use('/api/auth', authRoutes)

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
