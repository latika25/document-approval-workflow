import { createContext, useContext } from "react";
import type { Permission, User } from "../api/types";

export interface AuthContextValue {
  status: "loading" | "authenticated" | "anonymous";
  user: User | null;
  sessionExpired: boolean;
  login(username: string, password: string): Promise<User>;
  logout(): void;
  can(permission: Permission): boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return value;
}

export function homePathFor(user: User): string {
  if (user.permissions.includes("submissions:create")) return "/submissions";
  if (user.permissions.includes("submissions:review")) return "/review";
  return "/login";
}
