import path from "node:path";
import express from "express";
import helmet from "helmet";
import { createAuthenticate } from "./auth/auth.middleware.js";
import { createAuthRouter } from "./auth/auth.routes.js";
import { createAuthService } from "./auth/auth.service.js";
import { createTokenService } from "./auth/tokens.js";
import type { AppConfig } from "./config.js";
import type { Database } from "./db/database.js";
import { createDocsRouter } from "./docs/docs.routes.js";
import { apiNotFound, errorHandler } from "./middleware/error-handler.js";
import { createRateLimit } from "./middleware/rate-limit.js";
import type { FileStorage } from "./storage/file-storage.js";
import { createSubmissionsRepository } from "./submissions/submissions.repository.js";
import { createSubmissionsRouter } from "./submissions/submissions.routes.js";
import { createSubmissionsService } from "./submissions/submissions.service.js";
import { createUploadMiddleware } from "./submissions/upload.js";
import { createUsersRepository } from "./users/users.repository.js";

export interface AppDependencies {
  config: AppConfig;
  db: Database;
  storage: FileStorage;
}

export function createApp({ config, db, storage }: AppDependencies) {
  const usersRepo = createUsersRepository(db);
  const submissionsRepo = createSubmissionsRepository(db);

  const tokens = createTokenService(config.jwtSecret, config.jwtExpiresInSeconds);
  const authService = createAuthService({ usersRepo, tokens });
  const submissionsService = createSubmissionsService({ submissionsRepo, storage });

  const authenticate = createAuthenticate(tokens, usersRepo);
  const loginRateLimit = createRateLimit({
    enabled: config.rateLimitEnabled,
    windowMinutes: 15,
    limit: 20,
    message: "Too many sign-in attempts. Please try again in a few minutes.",
  });
  const uploadRateLimit = createRateLimit({
    enabled: config.rateLimitEnabled,
    windowMinutes: 15,
    limit: 30,
    message: "Too many submissions. Please try again in a few minutes.",
  });

  const app = express();
  if (config.trustProxy) {
    app.set("trust proxy", 1);
  }
  // CSP is off because the Swagger UI page loads its script from a CDN.
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", async (_req, res) => {
    await db.query("SELECT 1");
    res.json({ status: "ok" });
  });
  app.use("/api/auth", createAuthRouter({ authService, authenticate, loginRateLimit }));
  app.use(
    "/api/submissions",
    createSubmissionsRouter({
      submissionsService,
      authenticate,
      upload: createUploadMiddleware(config.maxUploadBytes),
      uploadRateLimit,
    }),
  );
  app.use("/api", createDocsRouter());
  app.use("/api", apiNotFound);

  // Docker image: serve the built frontend, with index.html for client-side routes.
  if (config.staticDir) {
    const staticDir = config.staticDir;
    app.use(express.static(staticDir));
    app.get("/{*path}", (_req, res) => {
      res.sendFile(path.join(staticDir, "index.html"));
    });
  }

  app.use(errorHandler);
  return app;
}
