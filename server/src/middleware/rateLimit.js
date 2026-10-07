import { AppError } from '../utils/AppError.js';

// Small in-memory limiter for sign-in and similar forms (one server process is enough here).
export function rateLimit({ windowMs = 15 * 60 * 1000, max = 10, key = (req) => req.ip } = {}) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const k = key(req);
    const entry = hits.get(k);
    if (!entry || entry.reset < now) {
      hits.set(k, { count: 1, reset: now + windowMs });
      if (hits.size > 10000) for (const [hk, hv] of hits) if (hv.reset < now) hits.delete(hk);
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.reset - now) / 1000)));
      return next(new AppError('Too many tries. Please wait a few minutes and try again.', 429, 'TOO_MANY_REQUESTS'));
    }
    next();
  };
}
