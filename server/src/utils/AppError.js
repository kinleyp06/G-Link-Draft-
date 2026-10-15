// An error that is safe to show to the user as is.
// Throw it from routes/services: throw new AppError('Room not found', 404, 'ROOM_NOT_FOUND')
export class AppError extends Error {
  constructor(message, statusCode = 400, code = 'BAD_REQUEST', fields) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    // Optional { fieldName: 'problem' } so forms can show each error under its box
    if (fields) this.fields = fields;
  }
}

export default AppError;
