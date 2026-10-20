import { rm } from "node:fs/promises";
import dotenv from "dotenv";
import { loadConfig } from "../config.js";
import { connectDatabase } from "./database.js";
import { runMigrations } from "./migrate.js";
import { seedDemoUsers, setupDatabase } from "./seed.js";

dotenv.config({ quiet: true });

const command = process.argv[2];
const config = loadConfig();
const db = await connectDatabase(config);

try {
  if (command === "setup") {
    await setupDatabase(db);
    console.log("Database is up to date and demo users exist.");
  } else if (command === "reset") {
    await runMigrations(db);
    await db.exec("DELETE FROM submissions; DELETE FROM users;");
    if (config.storageDriver === "local") {
      await rm(config.uploadDir, { recursive: true, force: true });
    }
    await seedDemoUsers(db);
    console.log("All data deleted and demo users re-created.");
  } else {
    console.error("Usage: cli.ts <setup|reset>");
    process.exitCode = 1;
  }
} finally {
  await db.close();
}
