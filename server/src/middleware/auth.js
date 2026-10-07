import * as users from '../models/userModel.js';
import { AppError } from '../utils/AppError.js';
import { verifyToken } from '../utils/tokens.js';

// Reads "Authorization: Bearer <token>" and loads the user fresh from the database,
// so a role change or a switched-off account takes effect at once.
export async function requireAuth(req, res, next) {
  try {
    const header = req.get('authorization') || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) throw new AppError('Please sign in.', 401, 'UNAUTHENTICATED');
    const payload = verifyToken(token, 'auth');
    const user = await users.findById(payload.sub);
    if (!user) throw new AppError('Please sign in.', 401, 'UNAUTHENTICATED');
    if (user.status !== 'Active') throw new AppError('This account is switched off.', 403, 'ACCOUNT_INACTIVE');
    req.user = users.toPublic(user);
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError('Please sign in.', 401, 'UNAUTHENTICATED'));
    if (!roles.includes(req.user.role)) return next(new AppError('You do not have permission to do this.', 403, 'FORBIDDEN'));
    next();
  };
}
