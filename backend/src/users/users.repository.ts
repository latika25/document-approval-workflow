import type { Role } from "../auth/permissions.js";
import type { Database } from "../db/database.js";
import type { User, UserWithPasswordHash } from "./user.js";

interface UserRow {
  id: string;
  name: string;
  username: string;
  role: Role;
  created_at: Date;
  password_hash: string;
}

const PUBLIC_COLUMNS = "id, name, username, role, created_at";

function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    role: row.role,
    createdAt: row.created_at,
  };
}

export function createUsersRepository(db: Database) {
  return {
    async findById(id: string): Promise<User | null> {
      const [row] = await db.query<UserRow>(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`, [
        id,
      ]);
      return row ? toUser(row) : null;
    },

    async findByUsernameWithPasswordHash(username: string): Promise<UserWithPasswordHash | null> {
      const [row] = await db.query<UserRow>(
        `SELECT ${PUBLIC_COLUMNS}, password_hash FROM users WHERE username = $1`,
        [username],
      );
      return row ? { ...toUser(row), passwordHash: row.password_hash } : null;
    },
  };
}

export type UsersRepository = ReturnType<typeof createUsersRepository>;
