import type { Request, RequestHandler } from "express";
import { errors } from "../errors.js";
import type { User } from "../users/user.js";
import type { UsersRepository } from "../users/users.repository.js";
import { hasPermission, type Permission } from "./permissions.js";
import type { TokenService } from "./tokens.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export function createAuthenticate(tokens: TokenService, usersRepo: UsersRepository) {
  const authenticate: RequestHandler = async (req, _res, next) => {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
    if (!token) {
      throw errors.unauthenticated();
    }

    const userId = tokens.verify(token);
    const user = userId ? await usersRepo.findById(userId) : null;
    if (!user) {
      throw errors.unauthenticated("Your session has expired. Please sign in again.");
    }

    req.user = user;
    next();
  };
  return authenticate;
}

export function requirePermission(permission: Permission): RequestHandler {
  return (req, _res, next) => {
    const user = currentUser(req);
    if (!hasPermission(user.role, permission)) {
      throw errors.forbidden();
    }
    next();
  };
}

export function currentUser(req: Request): User {
  if (!req.user) {
    throw errors.unauthenticated();
  }
  return req.user;
}
