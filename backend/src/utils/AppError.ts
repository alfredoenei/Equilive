/**
 * Custom application error with HTTP status code support.
 * Replaces `(error as any).statusCode` pattern across the codebase.
 */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
