import type { RequestHandler } from "express";
import multer from "multer";
import { errors } from "../errors.js";

export const ALLOWED_FILE_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word (.docx)",
  "text/plain": "Text (.txt)",
  "image/png": "PNG",
  "image/jpeg": "JPEG",
};

export function createUploadMiddleware(maxBytes: number): RequestHandler {
  const parseUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes, files: 1 },
    defParamCharset: "utf8",
    fileFilter: (_req, file, accept) => {
      if (file.mimetype in ALLOWED_FILE_TYPES) {
        accept(null, true);
      } else {
        const allowed = Object.values(ALLOWED_FILE_TYPES).join(", ");
        accept(errors.unsupportedFileType(`Unsupported file type. Allowed: ${allowed}.`));
      }
    },
  }).single("file");

  const maxMegabytes = Math.round((maxBytes / 1024 / 1024) * 10) / 10;
  return (req, res, next) => {
    parseUpload(req, res, (error: unknown) => {
      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        next(errors.payloadTooLarge(`The file is too large. Maximum size is ${maxMegabytes} MB.`));
      } else {
        next(error);
      }
    });
  };
}
