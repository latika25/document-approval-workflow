export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "ALREADY_REVIEWED"
  | "PAYLOAD_TOO_LARGE"
  | "UNSUPPORTED_FILE_TYPE"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export interface FieldError {
  field: string;
  message: string;
}

export class AppError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details: FieldError[] | undefined;

  constructor(status: number, code: ErrorCode, message: string, details?: FieldError[]) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const errors = {
  validation: (message: string, details?: FieldError[]) =>
    new AppError(400, "VALIDATION_ERROR", message, details),
  unauthenticated: (message = "Please sign in to continue.") =>
    new AppError(401, "UNAUTHENTICATED", message),
  forbidden: (message = "You do not have permission to do this.") =>
    new AppError(403, "FORBIDDEN", message),
  notFound: (message: string) => new AppError(404, "NOT_FOUND", message),
  conflict: (code: "ALREADY_REVIEWED", message: string) => new AppError(409, code, message),
  payloadTooLarge: (message: string) => new AppError(413, "PAYLOAD_TOO_LARGE", message),
  unsupportedFileType: (message: string) => new AppError(415, "UNSUPPORTED_FILE_TYPE", message),
  rateLimited: (message: string) => new AppError(429, "RATE_LIMITED", message),
};
