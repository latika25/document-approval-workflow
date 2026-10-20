import { createApp } from "../app.js";
import { createTokenService } from "../auth/tokens.js";
import { loadConfig, type AppConfig } from "../config.js";
import { createEmbeddedDatabase } from "../db/database.js";
import { setupDatabase } from "../db/seed.js";
import { createMemoryStorage } from "../storage/memory-storage.js";

export type DemoUsername = "submitter1" | "submitter2" | "reviewer1" | "reviewer2";

export async function createTestContext(overrides: Partial<AppConfig> = {}) {
  const db = await createEmbeddedDatabase();
  await setupDatabase(db);

  const storage = createMemoryStorage();
  const config: AppConfig = {
    ...loadConfig({ NODE_ENV: "test", RATE_LIMIT: "off" }),
    ...overrides,
  };
  const app = createApp({ config, db, storage });
  const tokens = createTokenService(config.jwtSecret, config.jwtExpiresInSeconds);

  async function userId(username: string): Promise<string> {
    const [row] = await db.query<{ id: string }>("SELECT id FROM users WHERE username = $1", [
      username,
    ]);
    if (!row) throw new Error(`No such user: ${username}`);
    return row.id;
  }

  async function auth(username: string): Promise<{ Authorization: string }> {
    return { Authorization: `Bearer ${tokens.sign(await userId(username))}` };
  }

  return {
    app,
    db,
    storage,
    config,
    tokens,
    userId,
    auth,
    resetSubmissions: () => db.exec("DELETE FROM submissions"),
    close: () => db.close(),
  };
}

export type TestContext = Awaited<ReturnType<typeof createTestContext>>;
