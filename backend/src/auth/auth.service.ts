import { errors } from "../errors.js";
import type { User } from "../users/user.js";
import type { UsersRepository } from "../users/users.repository.js";
import type { LoginInput } from "./auth.schemas.js";
import { hashPassword, verifyPassword } from "./password.js";
import type { TokenService } from "./tokens.js";

export interface AuthResult {
  token: string;
  user: User;
}

// Unknown usernames still pay for one hash check, so timing doesn't reveal which ones exist.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hashPassword("not-a-real-password-1"));

export function createAuthService(deps: { usersRepo: UsersRepository; tokens: TokenService }) {
  const { usersRepo, tokens } = deps;

  return {
    async login(input: LoginInput): Promise<AuthResult> {
      const found = await usersRepo.findByUsernameWithPasswordHash(input.username);

      const passwordOk = await verifyPassword(
        input.password,
        found?.passwordHash ?? (await getDummyHash()),
      );

      if (!found || !passwordOk) {
        throw errors.unauthenticated("Invalid username or password.");
      }

      const { passwordHash: _omit, ...user } = found;
      return { token: tokens.sign(user.id), user };
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
