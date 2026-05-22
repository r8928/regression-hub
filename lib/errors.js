/** @see {@link lib/__tests__/errors.test.js} */
export class ApiError extends Error {
  constructor(status, message, payload = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}
