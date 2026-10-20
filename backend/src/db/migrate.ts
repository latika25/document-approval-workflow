import type { Database } from "./database.js";
import { migrations } from "./migrations.js";

export async function runMigrations(db: Database): Promise<string[]> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id         TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const appliedRows = await db.query<{ id: string }>("SELECT id FROM schema_migrations");
  const applied = new Set(appliedRows.map((row) => row.id));
  const newlyApplied: string[] = [];

  for (const migration of migrations) {
    if (applied.has(migration.id)) continue;

    // A multi-statement exec runs as one implicit transaction. The id is our own constant, not user input.
    await db.exec(`
      ${migration.sql}
      INSERT INTO schema_migrations (id) VALUES ('${migration.id}');
    `);
    newlyApplied.push(migration.id);
  }

  return newlyApplied;
}
