import { AppError } from '../utils/AppError.js';

// Any request that no route handled.
export function notFound(req, res, next) {
  next(new AppError(`Not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
}

// Every error is sent as { message, code } (plus fields for form errors).
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    const body = { message: err.message, code: err.code };
    if (err.fields) body.fields = err.fields;
    return res.status(err.statusCode).json(body);
  }

  // express.json() could not read the request body
  if (err?.type === 'entity.parse.failed') {
    return res
      .status(400)
      .json({ message: 'The request body is not valid JSON.', code: 'BAD_JSON' });
  }

  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ message: 'The request is too large.', code: 'TOO_LARGE' });
  }

  // Anything else: log the details here, never send them to the user
  console.error('[error]', err);
  return res
    .status(500)
    .json({ message: 'Something went wrong on our side. Please try again later.', code: 'INTERNAL_ERROR' });
}
