// Lets async route handlers throw; the error goes to errorHandler.
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
