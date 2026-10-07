import 'dotenv/config';
import { getConfig } from './config/env.js';
import { testConnection } from './config/db.js';
import { createApp } from './app.js';
import { scheduleCleanup } from './jobs/dailyCleanup.js';

let config;
try {
  config = getConfig();
} catch (err) {
  console.error(`[config] ${err.message}`);
  process.exit(1);
}

const app = createApp({ clientUrl: config.clientUrl });

app.listen(config.port, async () => {
  console.log(`[server] G-Link API running on http://localhost:${config.port}`);

  // The server keeps running even if the database is down; /health/db reports it.
  const db = await testConnection();
  if (db.ok) {
    console.log(`[db] ${db.message}`);
  } else {
    console.error(`[db] ${db.message} The server is still running; /health/db will report 503 until this is fixed.`);
  }
  if (!config.email.host) console.log('[email] EMAIL_HOST is blank: emails are printed here instead of being sent.');
  scheduleCleanup();
});
