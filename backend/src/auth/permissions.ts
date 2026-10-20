export const ROLES = ["submitter", "reviewer"] as const;
export type Role = (typeof ROLES)[number];

export type Permission =
  "submissions:create" | "submissions:read:own" | "submissions:read:all" | "submissions:review";

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  submitter: ["submissions:create", "submissions:read:own"],
  reviewer: ["submissions:read:all", "submissions:review"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function permissionsFor(role: Role): Permission[] {
  return [...ROLE_PERMISSIONS[role]];
}
