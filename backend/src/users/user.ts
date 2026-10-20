import { permissionsFor, type Role } from "../auth/permissions.js";

export interface User {
  id: string;
  name: string;
  username: string;
  role: Role;
  createdAt: Date;
}

export interface UserWithPasswordHash extends User {
  passwordHash: string;
}

export function toUserResponse(user: User) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    permissions: permissionsFor(user.role),
    createdAt: user.createdAt,
  };
}
