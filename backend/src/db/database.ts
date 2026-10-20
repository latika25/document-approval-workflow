import { mkdir } from "node:fs/promises";
import pg from "pg";
import type { AppConfig } from "../config.js";

export interface Database {
  query<T extends object = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
}

export function createPostgresDatabase(connectionString: string): Database {
  const pool = new pg.Pool({ connectionString, max: 5 });

  return {
    async query<T extends object>(sql: string, params: unknown[] = []) {
      const result = await pool.query(sql, params);
      return result.rows as T[];
    },
    async exec(sql) {
      await pool.query(sql);
    },
    close: () => pool.end(),
  };
}

export async function createEmbeddedDatabase(dataDir?: string): Promise<Database> {
  // Lazy import so production never loads PGlite.
  const { PGlite } = await import("@electric-sql/pglite");
  if (dataDir) {
    await mkdir(dataDir, { recursive: true });
  }
  const db = dataDir ? new PGlite(dataDir) : new PGlite();
  await db.waitReady;

  return {
    async query<T extends object>(sql: string, params: unknown[] = []) {
      const result = await db.query<T>(sql, params);
      return result.rows;
    },
    async exec(sql) {
      await db.exec(sql);
    },
    close: () => db.close(),
  };
}

export async function connectDatabase(config: AppConfig): Promise<Database> {
  if (config.databaseUrl) {
    return createPostgresDatabase(config.databaseUrl);
  }
  console.log(`No DATABASE_URL set, using embedded Postgres at ${config.embeddedDbDir}`);
  return createEmbeddedDatabase(config.embeddedDbDir);
}
