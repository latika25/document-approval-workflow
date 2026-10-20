import path from "node:path";

export type StorageDriver = "local" | "blob";

export interface AppConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string | undefined;
  embeddedDbDir: string;
  jwtSecret: string;
  jwtExpiresInSeconds: number;
  storageDriver: StorageDriver;
  uploadDir: string;
  maxUploadBytes: number;
  staticDir: string | undefined;
  rateLimitEnabled: boolean;
  trustProxy: boolean;
}

const DEV_JWT_SECRET = "dev-only-secret-change-me";

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const nodeEnv = env.NODE_ENV ?? "development";
  const isProduction = nodeEnv === "production";
  const isVercel = Boolean(env.VERCEL);

  const databaseUrl = env.DATABASE_URL || env.POSTGRES_URL || undefined;
  if (isVercel && !databaseUrl) {
    throw new Error("DATABASE_URL is required on Vercel. Connect a Postgres database (e.g. Neon).");
  }

  const jwtSecret = env.JWT_SECRET || (isProduction ? undefined : DEV_JWT_SECRET);
  if (!jwtSecret) {
    throw new Error("JWT_SECRET must be set in production.");
  }

  const storageDriver = (env.STORAGE_DRIVER ??
    (env.BLOB_READ_WRITE_TOKEN ? "blob" : "local")) as StorageDriver;
  if (storageDriver !== "local" && storageDriver !== "blob") {
    throw new Error(`STORAGE_DRIVER must be "local" or "blob", got "${String(storageDriver)}".`);
  }
  // Vercel's disk is ephemeral, so local uploads would silently disappear.
  if (isVercel && storageDriver === "local") {
    throw new Error("File storage is required on Vercel. Connect a Vercel Blob store.");
  }

  return {
    nodeEnv,
    port: Number(env.PORT ?? 3000),
    databaseUrl,
    embeddedDbDir: path.resolve(env.EMBEDDED_DB_DIR ?? ".data/pglite"),
    jwtSecret,
    jwtExpiresInSeconds: 8 * 60 * 60,
    storageDriver,
    uploadDir: path.resolve(env.UPLOAD_DIR ?? "uploads"),
    // Vercel rejects request bodies over ~4.5 MB.
    maxUploadBytes: Number(env.MAX_UPLOAD_MB ?? 4) * 1024 * 1024,
    staticDir: env.STATIC_DIR ? path.resolve(env.STATIC_DIR) : undefined,
    rateLimitEnabled: env.RATE_LIMIT !== "off",
    trustProxy: isVercel || env.TRUST_PROXY === "true",
  };
}
