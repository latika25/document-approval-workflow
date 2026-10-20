import type { RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import { errors } from "../errors.js";

// Counters live in memory. With several instances this needs a shared store such as Redis.
export function createRateLimit(options: {
  enabled: boolean;
  windowMinutes: number;
  limit: number;
  message: string;
}): RequestHandler {
  if (!options.enabled) {
    return (_req, _res, next) => next();
  }

  return rateLimit({
    windowMs: options.windowMinutes * 60 * 1000,
    limit: options.limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, _res, next) => next(errors.rateLimited(options.message)),
  });
}
