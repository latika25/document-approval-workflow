import { hashPassword } from "../auth/password.js";
import type { Role } from "../auth/permissions.js";
import type { Database } from "./database.js";
import { runMigrations } from "./migrate.js";

interface DemoUser {
  name: string;
  username: string;
  password: string;
  role: Role;
}

export const DEMO_USERS: DemoUser[] = [
  { name: "Submitter One", username: "submitter1", password: "Submit@123", role: "submitter" },
  { name: "Submitter Two", username: "submitter2", password: "Submit@123", role: "submitter" },
  { name: "Reviewer One", username: "reviewer1", password: "Review@123", role: "reviewer" },
  { name: "Reviewer Two", username: "reviewer2", password: "Review@123", role: "reviewer" },
];

export async function seedDemoUsers(db: Database): Promise<void> {
  for (const user of DEMO_USERS) {
    const passwordHash = await hashPassword(user.password);
    await db.query(
      `INSERT INTO users (name, username, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO NOTHING`,
      [user.name, user.username, passwordHash, user.role],
    );
  }
}

export async function setupDatabase(db: Database): Promise<void> {
  await runMigrations(db);
  await seedDemoUsers(db);
}
