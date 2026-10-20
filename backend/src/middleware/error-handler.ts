import type { ErrorRequestHandler, RequestHandler } from "express";
import multer from "multer";
import { AppError, errors } from "../errors.js";

function isBodyParserError(error: unknown): error is { type: string } {
  return typeof error === "object" && error !== null && "type" in error;
}

function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return errors.payloadTooLarge("The file is too large.");
    }
    return errors.validation("Upload one file using the 'file' field.");
  }

  if (isBodyParserError(error)) {
    if (error.type === "entity.parse.failed") {
      return errors.validation("Request body is not valid JSON.");
    }
    if (error.type === "entity.too.large") {
      return errors.payloadTooLarge("Request body is too large.");
    }
  }

  return new AppError(500, "INTERNAL_ERROR", "Something went wrong. Please try again.");
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const appError = toAppError(error);

  if (appError.status >= 500) {
    console.error(error);
  }

  res.status(appError.status).json({
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.details && { details: appError.details }),
    },
  });
};

export const apiNotFound: RequestHandler = () => {
  throw errors.notFound("API route not found.");
};
