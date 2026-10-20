import { Router, type RequestHandler } from "express";
import { toUserResponse } from "../users/user.js";
import { parseInput } from "../validation.js";
import { currentUser } from "./auth.middleware.js";
import { loginSchema } from "./auth.schemas.js";
import type { AuthService } from "./auth.service.js";

export function createAuthRouter(deps: {
  authService: AuthService;
  authenticate: RequestHandler;
  loginRateLimit: RequestHandler;
}) {
  const { authService, authenticate, loginRateLimit } = deps;
  const router = Router();

  router.post("/login", loginRateLimit, async (req, res) => {
    const input = parseInput(loginSchema, req.body);
    const { token, user } = await authService.login(input);
    res.json({ token, user: toUserResponse(user) });
  });

  router.get("/me", authenticate, (req, res) => {
    res.json({ user: toUserResponse(currentUser(req)) });
  });

  return router;
}
