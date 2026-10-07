// An error that is safe to show to the user as is.
// Throw it from routes/services: throw new AppError('Room not found', 404, 'ROOM_NOT_FOUND')
export class AppError extends Error {
  constructor(message, statusCode = 400, code = 'BAD_REQUEST') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export default AppError;
