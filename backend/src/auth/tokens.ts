import jwt from "jsonwebtoken";

// The token only carries the user id; the user is loaded from the database on every request.
export interface TokenService {
  sign(userId: string): string;
  verify(token: string): string | null;
}

export function createTokenService(secret: string, expiresInSeconds: number): TokenService {
  return {
    sign(userId) {
      return jwt.sign({}, secret, {
        subject: userId,
        expiresIn: expiresInSeconds,
        algorithm: "HS256",
      });
    },
    verify(token) {
      try {
        const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
        return typeof payload === "object" && typeof payload.sub === "string" ? payload.sub : null;
      } catch {
        return null;
      }
    },
  };
}
