import { AppError } from '../utils/AppError.js';

// Any request that no route handled.
export function notFound(req, res, next) {
  next(new AppError(`Not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
}

// Every error is sent as { message, code }.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message, code: err.code });
  }

  // express.json() could not read the request body
  if (err?.type === 'entity.parse.failed') {
    return res
      .status(400)
      .json({ message: 'The request body is not valid JSON.', code: 'BAD_JSON' });
  }

  // Anything else: log the details here, never send them to the user
  console.error('[error]', err);
  return res
    .status(500)
    .json({ message: 'Something went wrong on our side. Please try again later.', code: 'INTERNAL_ERROR' });
}
