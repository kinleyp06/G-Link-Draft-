import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { getConfig } from '../config/env.js';
import { AppError } from './AppError.js';

// Sign-in token sent as "Authorization: Bearer <token>"
export function signAuthToken(user) {
  const { jwt: cfg } = getConfig();
  return jwt.sign({ sub: user.user_id, role: user.role, purpose: 'auth' }, cfg.secret, { expiresIn: cfg.expiresIn });
}

// Short fingerprint of the password hash: a reset link stops working once the password changes.
function passwordStamp(user) {
  return crypto.createHash('sha256').update(user.password).digest('hex').slice(0, 16);
}

export function signEmailToken(user, purpose) {
  const { jwt: cfg } = getConfig();
  const payload = { sub: user.user_id, purpose };
  if (purpose === 'reset') payload.pw = passwordStamp(user);
  return jwt.sign(payload, cfg.secret, { expiresIn: purpose === 'reset' ? '1h' : '24h' });
}

export function verifyToken(token, purpose) {
  const { jwt: cfg } = getConfig();
  try {
    const payload = jwt.verify(String(token || ''), cfg.secret);
    if (payload.purpose !== purpose) throw new Error('wrong purpose');
    return payload;
  } catch (err) {
    if (purpose === 'auth') {
      const expired = err.name === 'TokenExpiredError';
      throw new AppError(
        expired ? 'Your session has ended. Please sign in again.' : 'Please sign in.',
        401,
        expired ? 'TOKEN_EXPIRED' : 'UNAUTHENTICATED'
      );
    }
    throw new AppError('This link is not valid or has expired. Ask for a new one.', 400, 'INVALID_LINK');
  }
}

export function resetStampMatches(payload, user) {
  return payload.pw === passwordStamp(user);
}
