import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { connectDatabase } from "./db/database.js";
import { createFileStorage } from "./storage/file-storage.js";

type ExpressApp = ReturnType<typeof createApp>;

// Built once per warm instance. Migrations run at build time (see vercel.json).
let appPromise: Promise<ExpressApp> | undefined;

async function buildApp(): Promise<ExpressApp> {
  const config = loadConfig();
  const db = await connectDatabase(config);
  return createApp({ config, db, storage: createFileStorage(config) });
}

export async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  appPromise ??= buildApp().catch((error: unknown) => {
    appPromise = undefined; // retry on the next request
    throw error;
  });

  try {
    const app = await appPromise;
    app(req, res);
  } catch (error) {
    console.error("Failed to start the API", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "Server failed to start." } }),
    );
  }
}
