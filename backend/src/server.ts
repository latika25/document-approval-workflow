import dotenv from "dotenv";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { connectDatabase } from "./db/database.js";
import { setupDatabase } from "./db/seed.js";
import { createFileStorage } from "./storage/file-storage.js";

dotenv.config({ quiet: true });

const config = loadConfig();
const db = await connectDatabase(config);
await setupDatabase(db);
const storage = createFileStorage(config);
const app = createApp({ config, db, storage });

const server = app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port} (docs: /api/docs)`);
});

function shutdown() {
  server.close(() => {
    void db.close().finally(() => process.exit(0));
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
