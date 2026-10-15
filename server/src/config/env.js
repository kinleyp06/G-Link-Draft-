// Reads settings from environment variables (.env is loaded in server.js).
// loadConfig is pure so it can be tested with any object.

const REQUIRED = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];

export function loadConfig(env = {}) {
  const missing = REQUIRED.filter((key) => !env[key] || String(env[key]).trim() === '');
  if (missing.length > 0) {
    throw new Error(
      `Missing settings in server/.env: ${missing.join(', ')}. ` +
        'Copy server/.env.example to server/.env and fill them in.'
    );
  }

  return {
    port: toNumber(env.PORT, 5000),
    clientUrl: env.CLIENT_URL || 'http://localhost:5173',
    timeZone: env.APP_TIMEZONE || 'Asia/Thimphu',
    db: {
      host: env.DB_HOST,
      port: toNumber(env.DB_PORT, 3306),
      user: env.DB_USER,
      password: env.DB_PASSWORD ?? '',
      database: env.DB_NAME,
    },
    jwt: {
      secret: env.JWT_SECRET || '',
      expiresIn: env.JWT_EXPIRES_IN || '8h',
    },
    email: {
      host: env.EMAIL_HOST || '',
      port: toNumber(env.EMAIL_PORT, 587),
      user: env.EMAIL_USER || '',
      password: env.EMAIL_PASSWORD || '',
      from: env.EMAIL_FROM || 'G-Link <no-reply@g-link.local>',
    },
  };
}

function toNumber(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
}

let cached;

// Same as loadConfig(process.env), but only reads it once.
export function getConfig() {
  if (!cached) cached = loadConfig(process.env);
  return cached;
}
